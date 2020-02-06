import React, { Component } from 'react';
import { Link, NavLink, Switch, Route } from 'react-router-dom';
import SwitchToggler from 'react-switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faChevronCircleLeft, faUnlock } from '@fortawesome/free-solid-svg-icons';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';
import Scrollbars from 'react-custom-scrollbars';
import InventoryPage from './Inventory';
import { EntityManager } from 'typeorm';
import { ROOT_PATH, logErr } from '../system';
import path from 'path'
import * as fs from 'fs'
import AddToInventory from '../components/AddToInventory';
import Employee from '../components/Employee';

//#region Extra Interfaces
interface Lock {
  voids: boolean,
  refunds: boolean
}

interface AppConfig {
  lock: { voids: boolean, refunds: boolean },
  misc: { keyboard: boolean, sound: boolean },
  printOnSale: boolean,
  cashDrawer: {
    enabled: boolean,
    requireManager: boolean,
    openOnSale: boolean
  },
  payment: {
    enableGiftCard: boolean,
    useLoyaltyCard: boolean,
    enableExternalPayments: boolean
  }
}

interface _AppConfig {
  app: {
    sleepAfter?: number, // seconds
    keyboard: boolean,
    sound: boolean
  },
  manager: {
    allowRefunds: boolean,
    allowVoids: boolean,
    allowDrawerAccess: boolean
  },
  sync: {
    syncInterval: number, // minutes
    encrypt: boolean, // takes paid subscription
  }
}
//#endregion

//#region CONSTs
const SwitchProps = {
  onColor: "#86d3ff",
  onHandleColor: "#2693e6",
  handleDiameter: 30,
  uncheckedIcon: false,
  checkedIcon: false,
  boxShadow: "0px 1px 5px rgba(0, 0, 0, 0.6)",
  activeBoxShadow: "0px 0px 1px 10px rgba(0, 0, 0, 0.2)",
  height: 20,
  width: 48,
}
//#endregion

interface Props {
  dbManager: EntityManager,
  printer: ThermalPrinter
}

interface State {
  conf: AppConfig,
  authenticated: boolean,
  conf2: _AppConfig
}

const defaultConf: _AppConfig = {
  app: {
    keyboard: true,
    sound: true
  },
  manager: {
    allowRefunds: true,
    allowVoids: true,
    allowDrawerAccess: false
  },
  sync: {
    encrypt: false,
    syncInterval: 60
  }
}

class Settings extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      conf: {
        lock: { refunds: false, voids: true },
        misc: { keyboard: true, sound: false },
        printOnSale: true,
        cashDrawer: { enabled: true, openOnSale: true, requireManager: false },
        payment: {
          enableGiftCard: false,
          useLoyaltyCard: true,
          enableExternalPayments: false
        }
      },
      authenticated: false,
      conf2: defaultConf
    }
  }

  componentDidMount() {
    this.loadSettings().then(conf => {
      this.setState({ conf: conf })
    }).catch((err: Error) => {
      logErr(err);
      console.warn(err);
    })
  }

  componentDidCatch() {
    console.log('Component Fucked up');
  }

  loadSettings = (): Promise<AppConfig> => {
    return new Promise<AppConfig>((resolve, reject) => {
      let filePath = path.resolve(ROOT_PATH, 'conf.json');
      if (fs.existsSync(filePath)) {
        fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
          resolve(JSON.parse(data));
        });
      } else {
        reject(new Error("File doesn't exist"))
      }
    })
  }

  saveSettings = ({ preventDefault }: React.MouseEvent<HTMLButtonElement>) => {
    preventDefault();
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path.resolve(ROOT_PATH, 'conf.json'), JSON.stringify(this.state.conf), err => {
        if (err) reject(err);
        else resolve();
      })
    })
  }

  submitLocks = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Saving...');
    this.setState(({ authenticated }) => ({ authenticated: !authenticated }))

    // const { locks } = this.state
    // let response = await fetch(
    //   "https://storepro.com/company/storeid/termid/settings",
    //   { method: 'POST', body: JSON.stringify(locks) }
    // )

    // if (response.status !== 202)
    //   throw new Error("Changes were not accepted")
  }

  render() {
    const {
      conf: {
        cashDrawer,
        lock,
        misc,
        printOnSale,
        payment
      },
      conf2,
      authenticated
    } = this.state

    return (
      <div className="vw-100 vh-100 bg-light">
        <div className="d-flex h-100">
          {/* Sidebar */}
          <div className="bg-dark d-flex flex-column p-2" style={{ width: '15vw', height: '100%' }}>
            <Link to="/" className="btn btn-red btn-circle shadow-tight mb-2">
              <div className="h-100 d-flex justify-content-center align-items-center">
                <FontAwesomeIcon icon={faChevronCircleLeft} />
              </div>
            </Link>
            <div className="d-flex flex-column w-100">
              <div className="my-1">
                <NavLink exact to="/settings" className="w-100 btn btn-lg rounded btn-outline-light border-0">
                  General
                </NavLink>
              </div>
              <div className="my-1">
                <NavLink to="/settings/inventory" className="w-100 btn btn-lg rounded btn-outline-light border-0">Inventory</NavLink>
              </div>
              <div className="my-1">
                <NavLink to="/settings/employees" className="w-100 btn btn-lg rounded btn-outline-light border-0">Employees</NavLink>
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="flex-grow-1" style={{ width: '85vw' }}>
            <Switch>
              <Route exact path="/settings/inventory/add">
                <AddToInventory database={this.props.dbManager} />
              </Route>
              <Route exact path="/settings/inventory">
                <InventoryPage database={this.props.dbManager} />
              </Route>
              <Route exact path="/settings/employees">
                <Employee database={this.props.dbManager} />
              </Route>
              <Route exact path="/settings">
                <Scrollbars className="w-100 h-100">
                  <div className="card-columns p-4" style={{ columnCount: 2 }}>
                    <div className="card shadow">
                      <div className="card-body">
                        <h4 className="card-title">MISC</h4>
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={conf2.app.keyboard}
                              onChange={checked => this.setState(({ conf2 }) => ({
                                conf2: {
                                  ...conf2,
                                  app: {
                                    ...conf2.app,
                                    keyboard: checked
                                  }
                                }
                              }))}
                            />
                            <div className="pl-2">Keyboard Mode</div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={conf2.app.sound}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf2: {
                                  ...conf2,
                                  app: {
                                    ...conf2.app,
                                    sound: checked
                                  }
                                }
                              }))}
                            />
                            <div className="pl-2">Sound</div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="card shadow">
                      <div className="card-body">
                        <h4 className="card-title">Lock Higher Level Access</h4>
                        <p className="card-text">
                          This signifies a manager as requirement for voids, refunds etc.
                        </p>
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              disabled={!authenticated}
                              checked={lock.refunds}
                              onChange={checked => this.setState(({ conf }) => ({
                                conf: { ...conf, lock: { ...lock, refunds: checked } }
                              }))}
                            />
                            <div className="pl-2">
                              Refunds
                        </div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={lock.voids}
                              disabled={!authenticated}
                              onChange={checked => this.setState(({ conf }) => ({
                                conf: { ...conf, lock: { ...lock, voids: checked } }
                              }))}
                            />
                            <div className="pl-2">Voids</div>
                          </li>
                        </ul>
                        <div className="text-right pt-2">
                          {!authenticated
                            ? (
                              <button className="btn btn-danger shadow-tight" onClick={() => this.setState({ authenticated: true })}>
                                <FontAwesomeIcon icon={faLock} />{' '}Unlock
                          </button>
                            ) : (
                              <button className="btn btn-success shadow-tight" onClick={() => this.setState({ authenticated: false })}>
                                <FontAwesomeIcon icon={faUnlock} />{' '}Lock
                          </button>
                            )
                          }
                        </div>
                      </div>
                    </div>
                    <div className="card shadow">
                      <div className="card-body">
                        <h4 className="card-title">Printer &amp; Cash Drawer</h4>
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={cashDrawer.enabled}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: { ...config, cashDrawer: { ...cashDrawer, enabled: checked } }
                              }))}
                            />
                            <div className="pl-2">Enable Cash Drawer</div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={cashDrawer.requireManager}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: { ...config, cashDrawer: { ...cashDrawer, requireManager: checked } }
                              }))}
                            />
                            <div className="pl-2">Require Manager for Cash Drawer</div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={cashDrawer.openOnSale}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: { ...config, cashDrawer: { ...cashDrawer, openOnSale: checked } }
                              }))}
                            />
                            <div className="pl-2">Open Drawer On Sale</div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={printOnSale}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: { ...config, printOnSale: checked }
                              }))}
                            />
                            <div className="pl-2">Print receipt on Sale</div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="card shadow">
                      <div className="card-body">
                        <h4 className="card-title">Payment Options</h4>
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={payment.enableGiftCard}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: { ...config, payment: { ...payment, enableGiftCard: checked } }
                              }))}
                            />
                            <div className="pl-2">Enable Gift Cards</div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={payment.useLoyaltyCard}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: { ...config, payment: { ...payment, useLoyaltyCard: checked } }
                              }))}
                            />
                            <div className="pl-2">Use Loyalty Cards</div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={payment.enableExternalPayments}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: { ...config, payment: { ...payment, enableExternalPayments: checked } }
                              }))}
                            />
                            <div className="pl-2">Enable External Payments</div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 text-right">
                    <button className="btn btn-lg shadow-tight btn-success" onClick={this.saveSettings}>Save All</button>
                  </div>
                </Scrollbars>
              </Route>
            </Switch>
          </div>
        </div>
      </div>
    );
  }
}

export default Settings;