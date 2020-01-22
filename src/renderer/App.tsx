import React from 'react';
import { Switch, Route, NavLink } from 'react-router-dom';
import Landing from './components/Landing';
import Settings from './components/Settings';
import ReactLoading from 'react-loading';
import { remote } from 'electron';
import { connect, Product } from './database/database';
import { EntityManager } from 'typeorm';
import { init, ROOT_PATH, logErr } from './system';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';
import path from 'path';

interface State {
    printer: ThermalPrinter | null,
    product: Product | null,
    dbManager: EntityManager | null,
    message: string
}

class App extends React.Component<any, State> {
    constructor(props: any) {
        super(props);
        this.state = {
            printer: null,
            product: null,
            dbManager: null,
            message: ''
        };
    }

    componentDidMount() {
        try {
            // Initialize folder structures for the application
            init();
            
            let window = remote.getCurrentWindow();
            if (!window.isFullScreen()) {
                window.setFullScreen(true);
            }
        } catch (err) {
            logErr(err as Error);
        }
        // Ensure folder structure is present
        Promise.resolve(init);

        this.setState({ message: 'Loading printer...' });

        // Create task to connect to printer
        let printerTask = new Promise<ThermalPrinter>((resolve, reject) => {
            try {
                const _printer = new ThermalPrinter({
                    type: PrinterTypes.EPSON,
                    interface: 'printer:RECEIPT_PRINTER',
                    driver: require('printer')
                });
                if (_printer) {
                    resolve(_printer);
                }
                else
                    throw new Error('Printer not found');
            } catch (err) {
                reject(err);
            }
        })

        this.setState({ message: 'Initializing ...' });
        // Create task to connect to database
        let dbTask = new Promise<EntityManager>(async (resolve, reject) => {
            let dbPath = path.resolve(ROOT_PATH, 'inventory.db');
            try {
                resolve(await connect(dbPath));
            } catch (err) {
                reject(err)
            }
        })

        // Wait for database and printer to connect
        Promise.all<ThermalPrinter, EntityManager>([printerTask, dbTask])
            .then(([printer, db]) => {
                this.setState({ message: 'Loaded printer and database' });
                // setTimeout to give the feeling of 'staring an application'
                setTimeout(() => {
                    this.setState({
                        printer: printer,
                        dbManager: db
                    });
                }, 3000);
            }).catch((err: Error) => {
                logErr(err);
                console.error(err);
            });
    }

    render() {
        try {
            const { dbManager, printer, message } = this.state;
            if (!dbManager || !printer) {
                return (
                    <div className="d-flex flex-column justify-content-center align-items-center bg-light vh-100 vw-100">
                        <ReactLoading type={'bubbles'} color="#000000" />
                        <h5 className="font-kulim">{message}</h5>
                    </div>
                );
            }

            return (
                <Switch>
                    <Route exact path="/">
                        <Landing dbManager={dbManager} printer={printer} />
                    </Route>
                    <Route path="/settings">
                        <Settings dbManager={dbManager} printer={printer} />
                    </Route>
                    {/* No Path */}
                    <Route>
                        <p>
                            Sorry go back to {' '}<NavLink to='/'>home page</NavLink>
                        </p>
                    </Route>
                </Switch>
            )
        } catch (err) {
            console.log(err);
            return (
                <div>
                    <p>Component had an error</p>
                </div>
            )
        }
    }
}

export default App