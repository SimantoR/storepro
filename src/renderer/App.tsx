import React, { useState, useEffect } from 'react';
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
  types as PrinterTypes,
} from 'node-thermal-printer';
import path from 'path';

export interface AppConfigContext {
  conf: AppConfig;
  setConf: (conf: AppConfig) => void;
}

const defaultConf: AppConfig = {
  app: {
    keyboard: true,
    sound: true,
  },
  manager: {
    cashDrawer: {
      allowAccess: false,
      openOnSale: true,
    },
    payment: {
      giftCards: false,
      loyaltyCards: false,
      USDollar: true,
    },
    allowRefunds: true,
    allowVoids: true,
    printOnSale: true,
  },
  sync: {
    encrypt: true,
    syncInterval: 60,
  },
};

export const AppContext = React.createContext<AppConfigContext>({
  setConf: (conf: AppConfig) => {},
  conf: defaultConf,
});

export default function App(): JSX.Element {
  const [printer, set_printer] = useState<ThermalPrinter>();
  const [product, set_product] = useState<Product>();
  const [dbManager, set_dbManager] = useState<EntityManager>();
  const [message, set_message] = useState<string>();
  const [appConfig, set_appConfig] = useState<AppConfig>();

  useEffect(() => {
    Promise.resolve(init());
    set_message('Loading printer...');

    // Create task to connect to printer
    let printerTask = new Promise<ThermalPrinter>((resolve, reject) => {
      try {
        const _printer = new ThermalPrinter({
          type: PrinterTypes.EPSON,
          interface: 'printer:RECEIPT_PRINTER',
          driver: require('printer'),
        });
        if (_printer) {
          resolve(_printer);
        } else throw new Error('Printer not found');
      } catch (err) {
        reject(err);
      }
    });

    set_message('Initializing...');

    // Create task to connect to database
    let dbTask = new Promise<EntityManager>((resolve, reject) => {
      let dbPath = path.resolve(ROOT_PATH, 'inventory.db');
      // connect(dbPath, { sync: true })
      connect(dbPath, { sync: !fs.existsSync(dbPath) })
        .then(resolve)
        .catch(reject);
    });

    printerTask.then(set_printer).catch((error: Error | undefined) => {
      if (error) {
        logErr(error);
        console.error(error);
      }
      console.error('Failed to load printer');
    });

    dbTask.then(set_dbManager).catch((error: Error | undefined) => {
      if (error) {
        logErr(error);
        console.error(error);
      }
      console.error('Failed to load db');
    });

    loadSettings()
      .then(set_appConfig)
      .catch((error: Error | undefined) => {
        if (error) {
          logErr(error);
          console.error(error);
        }
        console.error('Failed to load settings');
      });
  }, []);

  try {
    if (!dbManager || !printer) {
      return (
        <div className="d-flex flex-column justify-content-center align-items-center">
          <ReactLoading type="balls" color="black" height="20%" width="20%" />
        </div>
      );
    }

    return (
      <AppContext.Provider value={{ setConf: set_appConfig, conf: appConfig! }}>
        <Switch>
          <Route exact path="/">
            <Landing dbManager={dbManager} printer={printer!} />
          </Route>
          <Route path="/settings">
            <Settings dbManager={dbManager} printer={printer!} />
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
