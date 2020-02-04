import React, { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import Sys from 'systeminformation';
import { printer as ThermalPrinter } from 'node-thermal-printer';
import requireStatic from '../requireStatic';
import Scrollbars from 'react-custom-scrollbars';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import NumPad from 'react-numpad';
import { logErr, MenuButtonProps, loadMenu } from '../system';
import { Product, Discount } from '../database/database';
import { EntityManager, LessThan, MoreThan } from 'typeorm';
import { getPrinter } from 'printer';
// @ts-ignore
import receipt from 'receipt';
import 'linqify';
import './bootstrap.min.css';
import './bootstrap_x.css';
import {
    faCogs,
    faPrint,
    faStore,
    faAdjust,
    faDesktop,
    faMoneyBill,
    faCreditCard,
    faBatteryFull,
    faBatteryHalf,
    IconDefinition,
    faBatteryEmpty,
    faBatteryQuarter,
    faBatteryThreeQuarters,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import Button from './Button';
import KeyboardInput from './KeyboardInput';

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
    dbManager: EntityManager;
    printer: ThermalPrinter;
}

interface State {
    items?: Item[];
    connStatus: boolean;
    multiplier?: number;
    skuInput: string;
    menu?: MenuButtonProps[];
    hoverElement?: JSX.Element;
    batteryStatus?: JSX.Element;
    keyboardInput?: number;
}

interface Item {
    name: string;
    qty: number;
    unitPrice: number;
    sku: string;
}

const greenDot = requireStatic('green_dot.webp');
const redDot = requireStatic('red_dot.webp');

// function toImage(base64: string, type: 'jpg' | 'png' | 'webp') {
//   return `data:image/${type};base64, ${base64}`;
// }

class Landing extends React.Component<Props, State> {
    mainInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: Props) {
        super(props);

        this.mainInputRef = React.createRef<HTMLInputElement>();

        this.state = {
            items: [],
            connStatus: true,
            skuInput: '',
            keyboardInput: undefined
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
        const checkBattery = () => {
            Sys.battery().then(({ hasbattery, ischarging, percent }) => {
                if (hasbattery && ischarging) {
                    let ico: IconDefinition = faDesktop;
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
                    this.setState({ batteryStatus: <FontAwesomeIcon icon={ico} /> });
                }
            });
        };

        setInterval(checkBattery, 5 * 60 * 1000);
    }

    /** Add product to card */
    addProduct = async (sku: string) => {
        const { dbManager: database } = this.props;
        const { items, multiplier } = this.state;

        let itemStore = items ?? [];

        if (itemStore.Any(x => x.sku === sku)) {
            const ind = itemStore.findIndex(x => x.sku === sku);
            itemStore[ind].qty += multiplier ?? 1;
        } else {
            const product = await database.findOne(Product, { where: { sku: sku } });

            if (!product) return;

            if (!items) {
                itemStore.push({
                    name: product.name,
                    sku: product.sku,
                    qty: multiplier ?? 1,
                    unitPrice: product.costPrice
                });
            } else {
                itemStore.push({
                    name: product.name,
                    sku: product.sku,
                    qty: multiplier ?? 1,
                    unitPrice: product.costPrice
                });
            }
        }

        this.setState({
            items: itemStore,
            multiplier: undefined
        })
    };

    searchProduct = ({
        currentTarget: { value }
    }: React.ChangeEvent<HTMLInputElement>) => {
        const { items, multiplier } = this.state;
        const { dbManager } = this.props;
        if (!value) return;
        dbManager
            .findOneOrFail(Product, {
                where: [{ sku: value }, { name: value }]
            })
            .then(product => {
                if (items) {
                    // if (items.Any(x => x.sku === product.sku)) {
                    //     let item = items.Where(x => x.sku === product.sku).First()
                    // }
                    items.push({
                        name: product.name,
                        qty: multiplier ?? 1,
                        sku: product.sku,
                        unitPrice: product.costPrice
                    });
                    dbManager
                        .find(Discount, {
                            where: {
                                product: product,
                                start: LessThan(new Date()),
                                end: MoreThan(new Date())
                            }
                        })
                        .then(discounts => {
                            if (discounts.length !== 0) {
                                return discounts.map(_discount => ({
                                    sku: product.sku,
                                    discount: _discount.dollarOff,
                                    qty: _discount.forQty
                                }));
                            }
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
        const { keyboardInput } = this.state;
        const closePaymentWin = () => this.setState({ hoverElement: undefined });

        this.setState({
            hoverElement: (
                <div className="card">
                    <div className="card-header bg-transparent d-flex">
                        <div className="mr-auto">Payment</div>
                        <div>
                            <Button className="btn btn-secondary btn-sm btn-circle" onClick={closePaymentWin}>
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="card-text" style={{ zIndex: 10 }}>
                            <input type="text" className="form-control" />
                            <KeyboardInput />
                        </div>
                    </div>
                </div>
            )
        });
    };

    checkConnection = () => {
        return new Promise<void>(() => {
            this.setState({ connStatus: true });
        });
    };

    formatReceipt = (params?: {
        currency?: string;
        width?: number;
        ruler?: string;
    }) => {
        let { items } = this.state;

        items = items?.sort((a, b) => b.qty - a.qty);

        let subTotal = items ? items?.Sum(item => item.unitPrice * item.qty) : 0;
        let hst_gst = subTotal * 0.15;
        let total = subTotal + hst_gst;

        if (params) {
            receipt.config = { ...receipt.config, ...params };
        }

        // const defaultConf = {
        //     currency: '$',
        //     width: 40,
        //     ruler: '-'
        // };

        // receipt.config = { ...receipt.config, ...defaultConf, ...params };
        console.log(receipt.config);

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
                    // { name: 'Date', value: new Date().toString("dd/MM/yyyy hh:mm tt") },
                    { name: 'Date', value: '23/04/1995 12:04 PM' },
                    { name: 'Order Number', value: '0123456789' }
                ]
            },
            {
                type: 'table',
                lines: items?.map(item => ({
                    item: item.name,
                    qty: item.qty,
                    cost: item.unitPrice * 100
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
                value:
                    "Thank you for shopping at Taste East! If you have any requests or complains, don't forget to contact us. Have a great day!",
                align: 'center',
                padding: 5
            },
            { type: 'empty' },
            { type: 'empty' }
        ]);

        return output;
    };

    printReceipt = () => {
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

            let receiptText = this.formatReceipt();
            console.log(receiptText);

            printer.clear();
            printer.print(receiptText);
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
                    <col width="4%" />
                    <col width="20%" />
                    <col width="20%" />
                    <col width="6%" />
                </colgroup>
                <thead>
                    <tr className="border-bottom">
                        <th className="text-center">Name</th>
                        <th className="text-center">Qty</th>
                        <th className="text-center">Unit Price</th>
                        <th className="text-center">Total</th>
                        <th className="text-center">Btn</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => {
                        return (
                            <tr key={i}>
                                {/* <td className="text-center border-right">{i + 1}</td> */}
                                <td>{item.name}</td>
                                <td className="text-center">{item.qty}</td>
                                <td className="text-center">$ {item.unitPrice}</td>
                                <td className="text-center">$ {item.unitPrice * item.qty}</td>
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
            hoverElement
        } = this.state;

        const { dbManager: database } = this.props;

        let btnStyle: CSSProperties = { width: '55px' };
        let borderedBtn: CSSProperties = { borderBottom: '10px solid orange' };
        let redBtn: CSSProperties = {
            boxShadow: 'inset 0px 34px 0px -15px #b54b3a!important',
            backgroundColor: '#a73f2d',
            color: '#ffffff',
            textShadow: '3px 5px 3px #7a2a1d',
            display: 'inline-block'
        };

        let subTotal = items ? items?.Sum(item => item.unitPrice * item.qty) : 0;
        let hst_gst = subTotal * 0.15;
        let total = subTotal + hst_gst;

        return (
            <div className="vw-100 vh-100 bg-light d-flex flex-column">
                {hoverElement && (
                    <div
                        className="d-flex align-items-center justify-content-center w-100 h-100"
                        style={{
                            position: 'absolute',
                            left: 0,
                            zIndex: 1,
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
                        <small className="text-monospace">Version: 0.0.2</small>
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
                <div className=" flex-grow-1 d-flex h-100 w-100">
                    <div
                        className="d-flex flex-column h-100 border-right"
                        style={{ width: '55vw' }}
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
                                    <button className="shadow-tight btn btn-success p-3 m-2">
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
                            <button
                                className="btn btn-xl btn-circle shadow-tight"
                                style={redBtn}
                            >
                                <FontAwesomeIcon icon={faAdjust} />
                            </button>
                            <button
                                className="btn btn-xl btn-circle text-white shadow-tight"
                                style={{
                                    textShadow: '3px 5px 3px #7b8052',
                                    backgroundColor: '#c0c781'
                                }}
                            >
                                <FontAwesomeIcon icon={faMoneyBill} />
                            </button>
                            <Button
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
                                <div className="p-3">{this.renderTable()}</div>
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
                                <h5 className="m-0">HST/GST</h5>
                                <h5 className="m-0">$ {hst_gst.toFixed(2)}</h5>
                            </div>
                            <div className="w-100 py-2 d-flex justify-content-between border-top">
                                <h3 className="m-0 font-weight-bold">Total</h3>
                                <h3 className="m-0 font-weight-bold">$ {total.toFixed(2)}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Landing;
