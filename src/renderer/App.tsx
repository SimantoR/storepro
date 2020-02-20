import React from 'react';
import { Switch, Route, NavLink } from 'react-router-dom';
import Landing from './pages/Landing';
import Settings from './pages/Settings';
import ReactLoading from 'react-loading';
import { remote } from 'electron';
import { connect, Product } from './database/database';
import { EntityManager } from 'typeorm';
import { init, ROOT_PATH, logErr, loadSettings } from './system';
import * as fs from 'promise-fs';
import {
  printer as ThermalPrinter,
  types as PrinterTypes
} from 'node-thermal-printer';
import path from 'path';

export interface AppConfig {
  app: {
    sleepAfter?: number; // seconds
    keyboard: boolean;
    sound: boolean;
  };
  manager: {
    cashDrawer: {
      allowAccess: boolean;
      openOnSale: boolean;
    };
    payment: {
      giftCards: boolean;
      loyaltyCards: boolean;
      USDollar: boolean;
    };
    allowRefunds: boolean;
    allowVoids: boolean;
    printOnSale: boolean;
  };
  sync: {
    syncInterval: number; // minutes
    encrypt: boolean; // takes paid subscription
  };
}

interface State {
  printer: ThermalPrinter | null;
  product: Product | null;
  dbManager: EntityManager | null;
  message: string;
  appConfig: AppConfig;
}

export interface AppConfigContext {
  conf: AppConfig;
  setConf: (conf: AppConfig) => void;
}

const defaultConf: AppConfig = {
  app: {
    keyboard: true,
    sound: true
  },
  manager: {
    cashDrawer: {
      allowAccess: false,
      openOnSale: true
    },
    payment: {
      giftCards: false,
      loyaltyCards: false,
      USDollar: true
    },
    allowRefunds: true,
    allowVoids: true,
    printOnSale: true
  },
  sync: {
    encrypt: true,
    syncInterval: 60
  }
};

export const AppContext = React.createContext<AppConfigContext>({
  setConf: (conf: AppConfig) => {},
  conf: defaultConf
});

class App extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      printer: null,
      product: null,
      dbManager: null,
      message: '',
      appConfig: defaultConf
    };
  }

  componentDidMount() {
    Promise.resolve(init());
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
        } else throw new Error('Printer not found');
      } catch (err) {
        reject(err);
      }
    });

    this.setState({ message: 'Initializing ...' });

    // Create task to connect to database
    let dbTask = new Promise<EntityManager>((resolve, reject) => {
      let dbPath = path.resolve(ROOT_PATH, 'inventory.db');
      // connect(dbPath, { sync: true })
      connect(dbPath, { sync: !fs.existsSync(dbPath) })
        .then(resolve)
        .catch(reject);
    });

    // Wait for database and printer to connect
    Promise.all<ThermalPrinter, EntityManager, AppConfig>([
      printerTask,
      dbTask,
      loadSettings()
    ])
      .then(([printer, db, conf]) => {
        const win = remote.getCurrentWindow();
        if (!win.isFocused()) win.show();

        this.setState({
          printer: printer,
          dbManager: db,
          appConfig: conf
        });
      })
      .catch((err: Error) => {
        logErr(err);
        console.error(err);
      });
  }

  setConf = (conf: AppConfig) => {
    this.setState({ appConfig: conf });
  };

  render() {
    try {
      const { dbManager, printer, message } = this.state;
      if (!dbManager || !printer) {
        return (
          <div className="d-flex flex-column justify-content-center align-items-center">
            <ReactLoading type="balls" color="black" height="20%" width="20%" />
          </div>
        );
      }

      return (
        <AppContext.Provider
          value={{ setConf: this.setConf, conf: this.state.appConfig }}
        >
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
                Sorry go back to <NavLink to="/">home page</NavLink>
              </p>
            </Route>
          </Switch>
        </AppContext.Provider>
      );
    } catch (err) {
      console.log(err);
      return (
        <div>
          <p>Component had an error</p>
        </div>
      );
    }
  }
}

export default App;
