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
import { ROOT_PATH, logErr, saveSettings } from '../tools/system';
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
              <Sales database={props.dbManager} printer={props.printer} />
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
                              setConf({ ...conf, app: { ...conf.app, keyboard: checked } });
                            }}
                          />
                          <div className="pl-2">Keyboard Mode</div>
                        </li>
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.app.sound}
                            onChange={checked => {
                              setConf({ ...conf, app: { ...conf.app, sound: checked } });
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
                              setConf({ ...conf, manager: { ...conf.manager, allowVoids: checked } });
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
                              setConf({
                                ...conf,
                                manager: {
                                  ...conf.manager,
                                  cashDrawer: {
                                    ...conf.manager.cashDrawer,
                                    allowAccess: checked
                                  }
                                }
                              });
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
                              setConf({ ...conf, manager: { ...conf.manager, cashDrawer: { ...conf.manager.cashDrawer, openOnSale: checked } } });
                            }}
                          />
                          <div className="pl-2">Open Drawer On Sale</div>
                        </li>
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.manager.printOnSale}
                            onChange={checked => {
                              setConf({ ...conf, manager: { ...conf.manager, printOnSale: checked } });
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
                              setConf({
                                ...conf,
                                manager: {
                                  ...conf.manager,
                                  payment: {
                                    ...conf.manager.payment,
                                    giftCards: checked
                                  }
                                }
                              });
                            }}
                          />
                          <div className="pl-2">Enable Gift Cards</div>
                        </li>
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.manager.payment.loyaltyCards}
                            onChange={checked => {
                              setConf({
                                ...conf,
                                manager: {
                                  ...conf.manager,
                                  payment: {
                                    ...conf.manager.payment,
                                    loyaltyCards: checked
                                  }
                                }
                              });
                            }}
                          />
                          <div className="pl-2">Use Loyalty Cards</div>
                        </li>
                        <li className="list-group-item d-flex align-items-center">
                          <SwitchToggler className="form-check-input"
                            {...SwitchProps}
                            checked={conf.manager.payment.USDollar}
                            onChange={checked => {
                              setConf({
                                ...conf,
                                manager: {
                                  ...conf.manager,
                                  payment: {
                                    ...conf.manager.payment,
                                    USDollar: checked
                                  }
                                }
                              });
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
                    saveSettings(conf)
                      .then(() => context.setConf(conf))
                      .catch(err => console.error(err));
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