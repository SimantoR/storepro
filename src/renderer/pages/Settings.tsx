import React, { Component } from 'react';
import { Link, NavLink, Switch, Route } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faChevronCircleLeft, faUnlock } from '@fortawesome/free-solid-svg-icons';
import { printer as ThermalPrinter } from 'node-thermal-printer';
import SwitchToggler from 'react-switch';
import Scrollbars from 'react-custom-scrollbars';
import { AppConfig, AppContext, AppConfigContext } from '../App';
import InventoryPage from './Inventory';
import { EntityManager } from 'typeorm';
import { ROOT_PATH, logErr, saveSettings } from '../system';
import path from 'path';
import * as fs from 'promise-fs';
import AddToInventory from '../components/AddToInventory';
import Sales from './Sales';


interface Props {
  dbManager: EntityManager,
  printer: ThermalPrinter
}

interface State {
  conf: AppConfig;
  authenticated: boolean;
}

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

// const defaultConf: AppConfig = {
//   app: {
//     keyboard: true,
//     sound: true
//   },
//   manager: {
//     cashDrawer: {
//       allowAccess: false,
//       openOnSale: true,
//     },
//     payment: {
//       giftCards: false,
//       loyaltyCards: false,
//       USDollar: true
//     },
//     allowRefunds: true,
//     allowVoids: true,
//     printOnSale: true
//   },
//   sync: {
//     encrypt: true,
//     syncInterval: 60
//   }
// }
// //#endregion

class Settings2 extends Component<Props, State> {
  context: AppConfigContext;

  constructor(props: any) {
    super(props);
    this.context = React.useContext(AppContext);
    this.state = {
      authenticated: false,
      conf: this.context.conf
    }
  }

  componentDidMount() {
    this.loadSettings();
  }

  componentDidCatch() {
    console.log('Component Fucked up');
  }

  loadSettings = () => {
    const filePath = path.resolve(ROOT_PATH, 'conf.json');
    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, { encoding: 'utf8' })
        .then(confBuffer => {
          const conf: AppConfig = JSON.parse(confBuffer);
          this.setState({ conf: conf });
        })
        .catch((err: Error) => console.error(err.message));
    } else {
      console.warn('No configuration found');
    }
  }

  saveSettings = (ev: React.MouseEvent<HTMLButtonElement>) => {
    if (ev.preventDefault) {
      ev.preventDefault();
    }
    else {
      debugger;
    }
    const filePath = path.resolve(ROOT_PATH, 'conf.json');
    fs.writeFile(filePath, JSON.stringify(this.state.conf))
      .then(() => console.log('Settings saved'))
      .catch((err: Error) => console.log(err.message));
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
      conf,
      authenticated
    } = this.state;

    return (
      <div className="vw-100 vh-100 bg-light">
        <div className="d-flex h-100">
          {/* Sidebar */}
          <div className="bg-dark d-flex flex-column p-2" style={{ width: '15vw', height: '100%' }}>
            <div>
              <Link to="/" className="btn btn-red shadow-tight btn-lg mb-2">
                <div className="h-100 d-flex justify-content-center align-items-center">
                  <FontAwesomeIcon icon={faChevronCircleLeft} />
                </div>
              </Link>
            </div>
            <div className="d-flex flex-column w-100">
              <div className="my-1">
                <NavLink exact to="/settings" className="w-100 btn btn-lg rounded btn-outline-light border-0">
                  General
                </NavLink>
              </div>
              <div className="my-1">
                <NavLink to="/settings/inventory" className="w-100 btn btn-lg rounded btn-outline-light border-0">Inventory</NavLink>
              </div>
              {/* <div className="my-1">
                <NavLink to="/settings/employees" className="w-100 btn btn-lg rounded btn-outline-light border-0">Employees</NavLink>
              </div> */}
              <div className="my-1">
                <NavLink to="/settings/sales" className="w-100 btn btn-lg rounded btn-outline-light border-0">Sales</NavLink>
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
              <Route exact path="/settings/sales">
                <Sales database={this.props.dbManager} />
              </Route>
              <Route exact path="/settings">
                <Scrollbars className="w-100 h-100">
                  <div className="card-columns p-4" style={{ columnCount: 2 }}>
                    <div className="card">
                      <div className="card-body shadow">
                        <h4 className="card-title">MISC</h4>
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={conf.app.keyboard}
                              onChange={checked => this.setState(({ conf }) => ({
                                conf: {
                                  ...conf,
                                  app: {
                                    ...conf.app,
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
                              checked={conf.app.sound}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: {
                                  ...conf,
                                  app: {
                                    ...conf.app,
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
                    <div className="card">
                      <div className="card-body shadow">
                        <h4 className="card-title">Lock Higher Level Access</h4>
                        <p className="card-text">
                          This signifies a manager as requirement for voids, refunds etc.
                        </p>
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              disabled={!authenticated}
                              checked={conf.manager.allowRefunds}
                              onChange={checked => this.setState(({ conf }) => ({
                                conf: { ...conf, manager: { ...conf.manager, allowRefunds: checked } }
                              }))}
                            />
                            <div className="pl-2">
                              Refunds
                        </div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={conf.manager.allowVoids}
                              disabled={!authenticated}
                              onChange={checked => this.setState(({ conf }) => ({
                                conf: { ...conf, manager: { ...conf.manager, allowVoids: checked } }
                              }))}
                            />
                            <div className="pl-2">Voids</div>
                          </li>
                        </ul>
                        <div className="text-right pt-2">
                          {!authenticated
                            ? (
                              <button className="btn btn-red shadow-tight" onClick={() => this.setState({ authenticated: true })}>
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
                    <div className="card">
                      <div className="card-body shadow">
                        <h4 className="card-title">Printer &amp; Cash Drawer</h4>
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              // checked={cashDrawer.enabled}
                              checked={conf.manager.cashDrawer.allowAccess}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: {
                                  ...conf,
                                  manager: {
                                    ...conf.manager,
                                    cashDrawer: {
                                      ...conf.manager.cashDrawer,
                                      allowAccess: checked
                                    }
                                  }
                                }
                              }))}
                            />
                            <div className="pl-2">Enable Cash Drawer</div>
                          </li>
                          {/* <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              // checked={cashDrawer.requireManager}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: { ...conf, manager: { ...conf.manager, allowRefunds: checked } }
                              }))}
                            />
                            <div className="pl-2">Require Manager for Cash Drawer</div>
                          </li> */}
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={conf.manager.cashDrawer.openOnSale}
                              onChange={checked => this.setState(({ conf: config }) => {
                                conf.manager.cashDrawer.openOnSale = checked;
                                this.setState({ conf: conf })
                              })}
                            />
                            <div className="pl-2">Open Drawer On Sale</div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={conf.manager.printOnSale}
                              onChange={checked => this.setState(({ conf: config }) => {
                                conf.manager.printOnSale = checked;
                                this.setState({ conf: conf });
                              })}
                            />
                            <div className="pl-2">Print receipt on Sale</div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-body shadow">
                        <h4 className="card-title">Payment Options</h4>
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={conf.manager.payment.giftCards}
                              onChange={checked => this.setState(({ conf: config }) => {
                                conf.manager.payment.giftCards = checked;
                                this.setState({ conf: conf });
                              })}
                            />
                            <div className="pl-2">Enable Gift Cards</div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={conf.manager.payment.loyaltyCards}
                              onChange={checked => this.setState(({ conf: config }) => {
                                conf.manager.payment.loyaltyCards = checked;
                                this.setState({ conf: conf })
                              })}
                            />
                            <div className="pl-2">Use Loyalty Cards</div>
                          </li>
                          <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              checked={conf.manager.payment.USDollar}
                              onChange={checked => this.setState(({ conf: config }) => {
                                conf.manager.payment.USDollar = checked;
                                this.setState({ conf: conf })
                              })}
                            />
                            <div className="pl-2">Accept US Dollars</div>
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

const Settings: React.FC<Props> = (props: Props) => {
  const context = React.useContext(AppContext);
  
  const [conf, setConf] = React.useState<AppConfig>(context.conf);
  const [authenticated, setAuth] = React.useState(false);

  return (
    <div className="vw-100 vh-100 bg-light">
      <div className="d-flex h-100">
        {/* Sidebar */}
        <div className="bg-dark d-flex flex-column p-2" style={{ width: '15vw', height: '100%' }}>
          <div>
            <Link to="/" className="btn btn-red shadow-tight btn-lg mb-2">
              <div className="h-100 d-flex justify-content-center align-items-center">
                <FontAwesomeIcon icon={faChevronCircleLeft} />
              </div>
            </Link>
          </div>
          <div className="d-flex flex-column w-100">
            <div className="my-1">
              <NavLink exact to="/settings" className="w-100 btn btn-lg rounded btn-outline-light border-0">
                General
                </NavLink>
            </div>
            <div className="my-1">
              <NavLink to="/settings/inventory" className="w-100 btn btn-lg rounded btn-outline-light border-0">Inventory</NavLink>
            </div>
            {/* <div className="my-1">
                <NavLink to="/settings/employees" className="w-100 btn btn-lg rounded btn-outline-light border-0">Employees</NavLink>
              </div> */}
            <div className="my-1">
              <NavLink to="/settings/sales" className="w-100 btn btn-lg rounded btn-outline-light border-0">Sales</NavLink>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="flex-grow-1" style={{ width: '85vw' }}>
          <Switch>
            <Route exact path="/settings/inventory/add">
              <AddToInventory database={props.dbManager} />
            </Route>
            <Route exact path="/settings/inventory">
              <InventoryPage database={props.dbManager} />
            </Route>
            <Route exact path="/settings/sales">
              <Sales database={props.dbManager} />
            </Route>
            <Route exact path="/settings">
              <Scrollbars className="w-100 h-100">
                <div className="card-columns p-4" style={{ columnCount: 2 }}>
                  <div className="card">
                    <div className="card-body shadow">
                      <h4 className="card-title">MISC</h4>
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.app.keyboard}
                            onChange={checked => {
                              conf.app.keyboard = checked;
                              setConf(conf);
                            }}
                          />
                          <div className="pl-2">Keyboard Mode</div>
                        </li>
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.app.sound}
                            onChange={checked => {
                              conf.app.sound = !checked;
                              setConf(conf);
                            }}
                          />
                          <div className="pl-2">Sound</div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-body shadow">
                      <h4 className="card-title">Lock Higher Level Access</h4>
                      <p className="card-text">
                        This signifies a manager as requirement for voids, refunds etc.
                        </p>
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            disabled={!authenticated}
                            checked={conf.manager.allowRefunds}
                            onChange={checked => {
                              conf.manager.allowRefunds = checked;
                              setConf(conf);
                            }}
                          />
                          <div className="pl-2">
                            Refunds
                        </div>
                        </li>
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.manager.allowVoids}
                            disabled={!authenticated}
                            onChange={checked => {
                              conf.manager.allowVoids = checked;
                              setConf(conf);
                            }}
                          />
                          <div className="pl-2">Voids</div>
                        </li>
                      </ul>
                      <div className="text-right pt-2">
                        {!authenticated
                          ? (
                            <button className="btn btn-red shadow-tight" onClick={() => setAuth(true)}>
                              <FontAwesomeIcon icon={faLock} />{' '}Unlock
                          </button>
                          ) : (
                            <button className="btn btn-success shadow-tight" onClick={() => setAuth(false)}>
                              <FontAwesomeIcon icon={faUnlock} />{' '}Lock
                          </button>
                          )
                        }
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-body shadow">
                      <h4 className="card-title">Printer &amp; Cash Drawer</h4>
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            // checked={cashDrawer.enabled}
                            checked={conf.manager.cashDrawer.allowAccess}
                            onChange={checked => {
                              conf.manager.cashDrawer.allowAccess = checked;
                              setConf(conf);
                            }}
                          />
                          <div className="pl-2">Enable Cash Drawer</div>
                        </li>
                        {/* <li className="list-group-item d-flex align-items-center">
                            <SwitchToggler className="form-check-input"
                              {...SwitchProps}
                              // checked={cashDrawer.requireManager}
                              onChange={checked => this.setState(({ conf: config }) => ({
                                conf: { ...conf, manager: { ...conf.manager, allowRefunds: checked } }
                              }))}
                            />
                            <div className="pl-2">Require Manager for Cash Drawer</div>
                          </li> */}
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.manager.cashDrawer.openOnSale}
                            onChange={checked => {
                              conf.manager.cashDrawer.openOnSale = checked;
                              setConf(conf);
                            }}
                          />
                          <div className="pl-2">Open Drawer On Sale</div>
                        </li>
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.manager.printOnSale}
                            onChange={checked => {
                              conf.manager.printOnSale = checked;
                              setConf(conf);
                            }}
                          />
                          <div className="pl-2">Print receipt on Sale</div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-body shadow">
                      <h4 className="card-title">Payment Options</h4>
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.manager.payment.giftCards}
                            onChange={checked => {
                              conf.manager.payment.giftCards = checked;
                              setConf(conf);
                            }}
                          />
                          <div className="pl-2">Enable Gift Cards</div>
                        </li>
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.manager.payment.loyaltyCards}
                            onChange={checked => {
                              conf.manager.payment.loyaltyCards = checked;
                              setConf(conf);
                            }}
                          />
                          <div className="pl-2">Use Loyalty Cards</div>
                        </li>
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.manager.payment.USDollar}
                            onChange={checked => {
                              conf.manager.payment.USDollar = checked;
                              setConf(conf);
                            }}
                          />
                          <div className="pl-2">Accept US Dollars</div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="p-4 text-right">
                  <button className="btn btn-lg shadow-tight btn-success" onClick={() => {
                    setConf(conf);
                    saveSettings(conf);
                    context.setConf(conf);
                  }}>
                    Save All
                  </button>
                </div>
              </Scrollbars>
            </Route>
          </Switch>
        </div>
      </div>
    </div>
  );
}

export default Settings;