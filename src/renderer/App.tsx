import React from 'react';
import { Switch, Route, NavLink } from 'react-router-dom';
import Landing from './components/Landing';
import Settings from './components/Settings';
import ReactLoading from 'react-loading';
import { connect } from './database/database';
import { EntityManager, getConnection, Connection, AbstractRepository } from 'typeorm';
import { init, ROOT_PATH, logErr, LOGDIR_PATH } from './system';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';
import path from 'path';

type GlobalCtx = {
  printer: ThermalPrinter,
  dbManager: EntityManager
}
export const AppContext = React.createContext<Partial<GlobalCtx>>({})

const App: React.FC = () => {
  const [dbManager, setDbManager] = React.useState<EntityManager>();
  const [printer, setPrinter] = React.useState<ThermalPrinter>();
  const [loaded, setLoaded] = React.useState(false)
  init();

  const createConn = (absPath: string) => {
    connect(absPath).then(manager => {
      console.log('New connection created');
      setDbManager(manager);
    }).catch(err => {
      console.log(">> Couldn't create a new connection to database");
    });
  }

  if (!dbManager) {
    let conn: Connection;
    let dbPath = path.resolve(ROOT_PATH, 'inventory.db');
    try {
      let conn = getConnection();
      if (!conn.isConnected) {
        let err = new Error('Database connection found but not connected')
        logErr(err);
        throw err;
      }
      else
        setDbManager(conn.manager);
    } catch (err) {
      console.warn(err.message);
      createConn(dbPath);
    }
  }

  if (!printer) {
    setPrinter(new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: "printer:RECEIPT_PRINTER",
      driver: require('printer'),
      options: {
        timeout: 5000
      }
    }));
  }

  if (!loaded && dbManager && printer)
    setLoaded(true)

  return (
    <div>
      {!loaded
        ? (
          <div className="d-flex justify-content-center align-items-center bg-dark vh-100 vw-100">
            <ReactLoading type={'bubbles'} />
          </div>
        ) : (
          <Switch>
            <Route exact path="/">
              <Landing dbManager={dbManager as EntityManager} printer={printer as ThermalPrinter} />
            </Route>
            <Route path="/settings">
              <Settings dbManager={dbManager as EntityManager} printer={printer as ThermalPrinter} />
            </Route>
            {/* No Path */}
            <Route>
              <p>
                Sorry go back to {' '}<NavLink to='/'>home page</NavLink>
              </p>
            </Route>
          </Switch>
        )
      }
    </div>
  )
}

export default App