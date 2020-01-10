import React from 'react';
import { Switch, Route, NavLink } from 'react-router-dom';
import Landing from './components/Landing';
import Settings from './components/Settings';
import ReactLoading from 'react-loading';
import { connect, Product } from './database/database';
import { EntityManager, getConnection, Connection, AbstractRepository } from 'typeorm';
import { init, ROOT_PATH, logErr, LOGDIR_PATH } from './system';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';
import path from 'path';

interface State {
  printer: ThermalPrinter | null,
  product: Product | null,
  dbManager: EntityManager | null
}

class App extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      printer: null,
      product: null,
      dbManager: null
    }
  }

  componentDidMount() {
    let printerTask = new Promise<ThermalPrinter>((resolve, reject) => {
      try {
        let _printer = new ThermalPrinter({
          type: PrinterTypes.EPSON,
          interface: "printer:RECEIPT_PRINTER",
          driver: require('printer'),
          options: {
            timeout: 5000
          }
        });
        if (_printer)
          resolve(_printer);
        else
          throw new Error('Printer not found');
      } catch (err) {
        reject(err);
      }
    })

    let dbTask = new Promise<EntityManager>(async (resolve, reject) => {
      let dbPath = path.resolve(ROOT_PATH, 'inventory.db');
      try {
        resolve(await connect(dbPath));
      } catch (err) {
        reject(err)
      }
    })

    console.log('Starting tasks...');
    Promise.all<ThermalPrinter, EntityManager>([printerTask, dbTask])
      .then(([printer, db]) => {
        setTimeout(() => {
          console.log('Updating state')
          this.setState({
            printer: printer,
            dbManager: db
          });
        }, 3000);
      }).catch((err) => {
        console.log('Error detected');
        logErr(err);
        console.error(err);
      });
  }

  render() {
    try {
      const { dbManager, printer } = this.state;
      if (!dbManager || !printer) {
        return (
          <div className="d-flex flex-column justify-content-center align-items-center bg-light vh-100 vw-100">
            <ReactLoading type={'bubbles'} color="#000000" />
            <h5 className="font-kulim">Loading</h5>
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