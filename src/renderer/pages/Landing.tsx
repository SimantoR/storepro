import React, { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import receipt from 'receipt';
import { round } from 'mathjs';
import Sys from 'systeminformation';
import { getPrinter } from 'printer';
import Button from '../components/Button';
import requireStatic from '../requireStatic.js';
import AddToMenu from '../components/AddToMenu';
import Scrollbars from 'react-custom-scrollbars';
import PaymentPanel from '../components/PaymentPanel';
import { EntityManager, LessThan, MoreThan } from 'typeorm';
import { printer as ThermalPrinter } from 'node-thermal-printer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { logErr, MenuButtonProps, loadMenu, saveMenu } from '../tools/system';
import 'datejs';
import 'linqify';
import {
  Product,
  Purchase,
  PaymentMethod,
  PurchaseItem
} from '../database/database';
import {
  faCogs,
  faTimes,
  faPrint,
  faStore,
  faDesktop,
  faBackspace,
  faMoneyBill,
  faCreditCard,
  faBatteryFull,
  faBatteryHalf,
  IconDefinition,
  faBatteryEmpty,
  faBatteryQuarter,
  faBatteryThreeQuarters,
  faChargingStation,
  faPlug
} from '@fortawesome/free-solid-svg-icons';

receipt.config = {
  ...receipt.config,
  currency: '$',
  width: 40,
  ruler: '-'
};

const httpProp = {
  headers: { Authorization: 'BEARER' }
};

interface Props {
  database: EntityManager;
  printer: ThermalPrinter;
}

interface IState {
  items: Item[];
  connStatus: boolean;
  multiplier?: number;
  skuInput: string;
  menu?: MenuButtonProps[];
  hoverElement?: JSX.Element;
  batteryStatus?: JSX.Element;
  keyboardInput: string;
  paid?: number;
}

interface Item {
  product: Product;
  qty: number;
}

const greenDot = requireStatic('green_dot.webp');
const redDot = requireStatic('red_dot.webp');

function getBatteryStatus(): Promise<IconDefinition> {
  return new Promise<IconDefinition>((resolve, reject) => {
    Sys.battery()
      .then(({ hasbattery, ischarging, percent, acconnected }) => {
        let ico: IconDefinition = faDesktop;
        if (hasbattery) {
          if (ischarging) {
            ico = faPlug;
          } else if (acconnected) {
            ico = faChargingStation;
          } else {
            if (percent > 75) {
              ico = faBatteryFull;
            } else if (percent > 50) {
              ico = faBatteryThreeQuarters;
            } else if (percent > 25) {
              ico = faBatteryHalf;
            } else if (percent > 0) {
              ico = faBatteryQuarter;
            } else {
              ico = faBatteryEmpty;
            }
          }
        }
        resolve(ico);
      })
      .catch(err => reject(err));
  });
}

class Landing extends React.Component<Props, IState> {
  private mainInputRef: React.RefObject<HTMLInputElement>;
  private intervals: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);

    this.mainInputRef = React.createRef<HTMLInputElement>();

    this.state = {
      items: [],
      connStatus: true,
      skuInput: '',
      keyboardInput: ''
    };
  }

  componentDidMount() {
    loadMenu()
      .then(menu => {
        this.setState({ menu: menu });
      })
      .catch(err => {
        if (err) {
          console.warn(err);
          logErr(err);
        }
      });

    getBatteryStatus()
      .then(icon => {
        this.setState({ batteryStatus: <FontAwesomeIcon icon={icon} /> });
      })
      .catch((err: Error) => logErr(err));

    const id = setInterval(() => {
      getBatteryStatus()
        .then(icon => {
          this.setState({ batteryStatus: <FontAwesomeIcon icon={icon} /> });
        })
        .catch((err: Error) => logErr(err));
    }, 30 * 1000);
  }

  componentWillUnmount() {
    this.intervals.forEach(timeout => clearInterval(timeout));
    this.intervals = [];
  }

  /** Add product to card */
  addProduct = async (sku: string) => {
    const { database } = this.props;
    const { items, multiplier } = this.state;

    // let itemStore = items ?? [];

    if (items.Any(({ product }) => product.sku === sku)) {
      const ind = items.findIndex(({ product }) => product.sku === sku);
      items[ind].qty += multiplier ?? 1;
    } else {
      const product = await database.findOne(Product, { where: { sku: sku } });

      if (!product) return;

      items.push({
        product: product,
        qty: multiplier ?? 1
      });
    }

    this.setState({
      items: items,
      multiplier: undefined
    });
  };

  searchProduct = ({
    currentTarget: { value }
  }: React.ChangeEvent<HTMLInputElement>) => {
    const { items, multiplier } = this.state;
    const { database } = this.props;
    if (!value) {
      this.setState({ skuInput: '' });
      return;
    }
    database
      .findOneOrFail(Product, {
        where: [{ sku: value }, { name: value }]
      })
      .then(product => {
        if (items) {
          items.push({
            product: product,
            qty: multiplier ?? 1
          });
        }
        this.setState({ skuInput: '', multiplier: undefined });
      })
      .catch(() => {
        console.log(`>> Product with SKU ${value} wasn't found`);
        this.setState({ skuInput: value });
      });
  };

  showPayment = () => {
    const { items } = this.state;
    const { database } = this.props;

    const closePaymentWin = () => this.setState({ hoverElement: undefined });

    const onSubmit = async (value: number) => {
      let newState: Partial<IState> = { paid: value };

      // Subtotal using costprice * qty of each item
      let subTotal = items ? items.Sum(x => x.product.costPrice * x.qty) : 0;

      // tax = total * (tax of each item * cost price of each item)
      let hst_gst = round(items.Sum(x => x.product.tax * x.product.costPrice), 3);
      let total = round(subTotal + hst_gst - (value || 0), 2);

      debugger;

      if (total <= 0) {
        // create transaction
        let purchaseLog = database.create(Purchase, {
          paid: value,
          price: subTotal,
          tax: hst_gst,
          paymentMethod: PaymentMethod.debit,
          timestamp: new Date()
        });

        // create transaction items
        let purchaseItems = items.map(item => {
          return database.create(PurchaseItem, {
            product: item.product,
            qty: item.qty
          });
        });

        database
          .save(Purchase, purchaseLog)
          .then(result => {
            purchaseItems.forEach(t => {
              t.purchase = result;
            });

            database
              .save(PurchaseItem, purchaseItems)
              .then(() => {
                this.setState({ paid: value });
                this.printReceipt(this.formatReceipt(result.id));
              })
              .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
      }
    };

    this.setState({
      hoverElement: (
        <PaymentPanel
          initialValue={this.state.paid}
          onClose={closePaymentWin}
          onSubmit={onSubmit}
        />
      )
    });
  };

  addToMenu = () => {
    const { menu } = this.state;

    const onAdd = (props: MenuButtonProps) => {
      if (menu) {
        menu.push(props);
        saveMenu(menu);
      }
    };

    this.setState({
      hoverElement: (
        <AddToMenu
          database={this.props.database}
          onAdd={onAdd}
          onClose={() => this.setState({ hoverElement: undefined })}
        />
      )
    });
  };

  checkConnection = () => {
    return new Promise<void>(() => {
      this.setState({ connStatus: true });
    });
  };

  formatReceipt = (
    id: number,
    params?: { currency?: string; width?: number; ruler?: string }
  ) => {
    let { items } = this.state;

    // get transaction id
    const transactionId = id.toString().padStart(9, '0');

    items = items?.sort((a, b) => b.qty - a.qty);

    let subTotal = items
      ? items?.Sum(({ product, qty }) => product.costPrice * qty)
      : 0;

    let hst_gst = subTotal * 0.15;
    let total = subTotal + hst_gst;

    if (params) receipt.config = { ...receipt.config, ...params };

    let output: string = receipt.create([
      {
        type: 'text',
        value: [
          'TASTE EAST',
          '62 Allandale Rd',
          'taste.east@hotmail.com',
          'www.tasteeastnl.ca'
        ],
        align: 'center'
      },
      { type: 'empty' },
      {
        type: 'properties',
        lines: [
          { name: 'Date', value: new Date().toString('dd/MM/yyyy hh:mm tt') },
          { name: 'Order Number', value: transactionId }
        ]
      },
      {
        type: 'table',
        lines: items?.map(({ product, qty }) => ({
          item: product.name,
          qty: qty,
          cost: product.costPrice * 100
        }))
      },
      // {
      //   type: 'table', lines: [
      //     { item: 'Product 1', qty: 1, cost: 1000 },
      //     { item: 'Product 2 with a really long name', qty: 1, cost: 17500, discount: { type: 'absolute', value: 1000 } },
      //     { item: 'Another product wth quite a name', qty: 2, cost: 900 },
      //     { item: 'Product 4', qty: 1, cost: 80, discount: { type: 'percentage', value: 0.15 } },
      //     { item: 'This length is ridiculously lengthy', qty: 14, cost: 8516 },
      //     { item: 'Product 6', qty: 3, cost: 500 },
      //     { item: 'Product 7', qty: 3, cost: 500, discount: { type: 'absolute', value: 500, message: '3 for the price of 2' } }
      //   ], align: 'center'
      // },
      { type: 'empty' },
      { type: 'text', value: 'Not all items include tax.', align: 'center' },
      { type: 'empty' },
      {
        type: 'properties',
        lines: [
          { name: 'Sub Total', value: '$ ' + subTotal.toFixed(2) },
          { name: 'GST/HST', value: '$ ' + hst_gst.toFixed(2) },
          { name: 'Total', value: '$ ' + total.toFixed(2) }
        ]
      },
      // { type: 'empty' },
      // {
      //   type: 'properties', lines: [
      //     { name: 'Amount Received', value: 'CAD XX.XX' },
      //     { name: 'Amount Returned', value: 'CAD XX.XX' }
      //   ]
      // },
      { type: 'empty' },
      {
        type: 'text',
        value: `Thank you for shopping at Taste East!
          If you have any requests or complains,
          don't forget to contact us. Have a great day!`,
        align: 'center',
        padding: 5
      },
      { type: 'empty' },
      { type: 'empty' }
    ]);

    console.log(output);

    return output;
  };

  printReceipt = (receiptTxt: string) => {
    const { printer } = this.props;

    try {
      // get printer info
      let printerInfo = getPrinter('RECEIPT_PRINTER');

      // if printer is attempting to connect, don't push a new printing job
      if (
        printerInfo.options['printer-state-reasons'].includes(
          'connecting-to-device'
        )
      ) {
        console.log(printerInfo.options);
        return;
      }

      console.log(receiptTxt);

      printer.clear();
      printer.print(receiptTxt);
      printer.cut();
      printer.execute();
      printer.clear();
    } catch (err) {
      console.log('Detected error');
      console.warn(err.message);
      logErr(err as Error);
    }
  };

  renderTable = () => {
    const { items, multiplier } = this.state;
    if (!items) return;

    return (
      <table className="table table-striped table-borderless w-100">
        <colgroup>
          <col width="50%" />
          <col width="5%" />
          <col width="20%" />
          <col width="15%" />
          <col width="10%" />
        </colgroup>
        <thead
          style={{ background: 'linear-gradient(0.5turn, #f8f9fa, #ededed)' }}
        >
          <tr className="border-bottom">
            <th className="text-center">Name</th>
            <th className="text-center">Qty</th>
            <th className="text-center">Unit Price</th>
            <th className="text-center">Total</th>
            <th className="text-center">Btn</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ product, qty }, i) => {
            return (
              <tr key={i}>
                {/* <td className="text-center border-right">{i + 1}</td> */}
                <td>{product.name}</td>
                <td className="text-center">{qty}</td>
                <td className="text-center">$ {product.costPrice}</td>
                <td className="text-center">$ {product.costPrice * qty}</td>
                <td className="text-center">
                  <Button
                    className="btn btn-sm btn-circle btn-danger shadow-tight"
                    onClick={() => {
                      items.splice(i, 1);
                      this.setState({ items: items });
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                </td>
              </tr>
            );
          })}
          {multiplier && (
            <tr>
              <td className="text-monospace">{`${multiplier} x`}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  render() {
    const {
      items,
      menu,
      connStatus,
      multiplier,
      skuInput,
      paid,
      hoverElement
    } = this.state;

    let btnStyle: CSSProperties = { width: '55px' };
    let borderedBtn: CSSProperties = { borderBottom: '10px solid orange' };
    let redBtn: CSSProperties = {
      boxShadow: 'inset 0px 34px 0px -15px #b54b3a!important',
      backgroundColor: '#a73f2d',
      color: '#ffffff',
      textShadow: '3px 5px 3px #7a2a1d',
      display: 'inline-block'
    };

    let subTotal = items
      ? items.Sum(item => item.product.costPrice * item.qty)
      : 0;
    // tax = total * (tax of each item * cost price of each item)
    let hst_gst = items.Sum(x => x.product.tax * x.product.costPrice);
    let total = subTotal + hst_gst - (paid || 0);

    return (
      <div className="vw-100 vh-100 bg-light d-flex flex-column">
        {hoverElement && (
          <div
            className="d-flex align-items-center justify-content-center w-100 h-100"
            style={{
              position: 'absolute',
              left: 0,
              zIndex: 2,
              background: 'rgba(0, 0, 0, 0.4)'
            }}
          >
            {hoverElement}
          </div>
        )}
        <div
          className="bg-dark d-flex flex-row-reverse"
          style={{ height: '35px' }}
        >
          {this.state.batteryStatus && (
            <Button className="btn btn-sm btn-icon">
              {this.state.batteryStatus}
            </Button>
          )}
          <Button className="btn btn-sm btn-icon">
            <FontAwesomeIcon icon={faStore} /> StorePro
          </Button>
          <Button className="btn btn-sm btn-icon">
            <small className="text-monospace">Version: beta-1.0</small>
          </Button>
          <button className="btn btn-sm btn-icon h-100">
            Connection:{' '}
            <img
              style={{ objectFit: 'cover', height: '50%', width: 'auto' }}
              src={connStatus ? greenDot : redDot}
              alt="status"
            />
          </button>
        </div>
        <div className="flex-grow-1 d-flex h-100 w-100">
          <div
            className="d-flex flex-column h-100 border-right"
            style={{
              width: '55vw'
              // background: `center / contain no-repeat url(${requireStatic("logo.png")})`
            }}
          >
            <div className="flex-grow-1 py-2 w-100">
              <div className="d-flex justify-content-around w-100 py-4">
                {Array.from({ length: 9 }, (n, k) => {
                  let btnClass = 'btn btn-lg py-3 px-4 btn-light shadow-tight';
                  if (multiplier && multiplier === k + 1) {
                    btnClass += `${btnClass} active`;
                  }
                  return (
                    <button
                      key={k}
                      className={btnClass}
                      onClick={() => {
                        if (multiplier === k + 1)
                          this.setState({ multiplier: undefined });
                        else this.setState({ multiplier: k + 1 });

                        this.mainInputRef.current!.focus();
                      }}
                    >
                      {k + 1}
                    </button>
                  );
                })}
              </div>
              <Scrollbars className="w-100 h-100">
                <div className="w-100 text-center border-bottom font-kulim text-uppercase">
                  <h5>Retail</h5>
                </div>
                <div className="d-flex flex-wrap justify-content-between align-items-center px-3">
                  {menu &&
                    menu.map(({ image, name, sku }, i) => {
                      if (!image) return null;
                      return (
                        <Button
                          key={i}
                          style={borderedBtn}
                          className="shadow-tight btn p-3 m-2 btn-darker"
                          audioSrc={require('../resources/btn_audio.wav')}
                          onClick={() => this.addProduct(sku)}
                        >
                          <img
                            src={`file://${image}`}
                            alt={name}
                            style={btnStyle}
                          />
                        </Button>
                      );
                    })}
                  <button
                    className="shadow-tight btn btn-success p-3 m-2"
                    onClick={this.addToMenu}
                  >
                    <img
                      src="https://cdn.pixabay.com/photo/2012/04/02/16/07/plus-24844_960_720.png"
                      alt="add_item"
                      style={btnStyle}
                    />
                  </button>
                </div>
              </Scrollbars>
            </div>
            <div
              className="d-flex justify-content-around align-items-center py-2 border-top"
              style={{ minHeight: '18vh' }}
            >
              <Link
                to="/settings"
                className="btn btn-xl btn-circle text-white shadow-tight d-flex align-items-center justify-content-center"
                style={{
                  textShadow: '3px 5px 3px #4a7485',
                  backgroundColor: '#79bad4'
                }}
              >
                <FontAwesomeIcon icon={faCogs} />
              </Link>
              <button
                className="btn btn-xl btn-circle text-white shadow-tight"
                style={{
                  textShadow: '3px 5px 3px #85684e',
                  backgroundColor: '#c59b76'
                }}
              >
                <FontAwesomeIcon icon={faPrint} />
              </button>
              <Button
                className="btn btn-xl btn-circle shadow-tight"
                style={redBtn}
                onClick={() => {
                  this.setState({ items: [], paid: undefined });
                }}
              >
                <FontAwesomeIcon icon={faBackspace} />
              </Button>
              <Link
                to="/config"
                className="btn btn-xl btn-circle text-white shadow-tight d-flex justify-content-center align-items-center"
                style={{
                  textShadow: '3px 5px 3px #7b8052',
                  backgroundColor: '#c0c781'
                }}
              >
                <FontAwesomeIcon icon={faMoneyBill} />
              </Link>
              <Button
                disabled={total == 0}
                className="btn btn-xl btn-circle text-white shadow-tight"
                style={{
                  textShadow: '3px 5px 3px #7a4b41',
                  backgroundColor: '#c17767'
                }}
                onClick={this.showPayment}
              >
                <FontAwesomeIcon icon={faCreditCard} />
              </Button>
            </div>
          </div>
          <div className="flex-grow-1 d-flex flex-column bg-light no-selection">
            <form className="d-flex py-2 font-kulim px-2">
              <div className="form-inline w-100 mr-2">
                <input
                  autoFocus
                  ref={this.mainInputRef}
                  className="form-control bg-light w-100 shadow-none"
                  type="text"
                  name="search"
                  placeholder="Barcode"
                  value={skuInput}
                  onChange={this.searchProduct}
                />
              </div>
              {/* <button type="submit" className="btn btn-light shadow-tight">Search</button> */}
            </form>
            <div className="flex-grow-1">
              <Scrollbars className="w-100 h-100">
                {/* <div className="">{this.renderTable()}</div> */}
                {this.renderTable()}
              </Scrollbars>
            </div>
            <div
              className="d-flex flex-column w-100 px-2 border-top font-kulim"
              style={{ minHeight: '18vh' }}
            >
              <div className="w-100 py-2 d-flex justify-content-between align-items-center">
                <h5 className="m-0">Sub Total</h5>
                <h5 className="m-0">$ {subTotal.toFixed(2)}</h5>
              </div>
              <div className="w-100 py-2 d-flex justify-content-between align-items-center border-top">
                <div className="d-flex">
                  <h5 className="m-0">HST/GST</h5>
                  <Button className="btn btn-sm btn-circle btn-red">
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                </div>
                <h5 className="m-0">$ {hst_gst.toFixed(2)}</h5>
              </div>
              <div className="w-100 py-2 d-flex justify-content-between border-top">
                <h3 className="m-0 font-weight-bold">Total</h3>
                <h3 className="m-0 font-weight-bold">$ {total.toFixed(2)}</h3>
              </div>
              {paid && (
                <div className="w-100 py-2 d-flex justify-content-between border-top">
                  <h5 className="m-0 text-danger">Paid</h5>
                  <h5 className="m-0 text-danger">$ {paid.toFixed(2)}</h5>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Landing;
