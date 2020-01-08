import React, { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import Sys from 'systeminformation';
import { printer as ThermalPrinter, types as PrinterTypes } from 'node-thermal-printer';
import requireStatic from '../requireStatic';
import Scrollbars from 'react-custom-scrollbars';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill, faCogs, faRecycle, faStore, faDatabase } from '@fortawesome/free-solid-svg-icons';
import { logErr } from '../system';
import { Product } from '../database/database';
import { EntityManager } from 'typeorm';
import { remote } from 'electron';
// @ts-ignore
import { getPrinter } from 'printer'
// @ts-ignore
import receipt from 'receipt'
import 'linqify'
import './bootstrap.min.css'
import './bootstrap_x.css'

const httpProp = {
  headers: { Authorization: 'BEARER' }
}

interface Props {
  dbManager: EntityManager,
  printer: ThermalPrinter
}

interface State {
  batteryInfo?: number | string,
  items?: Item[],
  connStatus: boolean,
  multiplier?: number,
  skuInput: string
}

interface Item {
  name: string,
  qty: number,
  unitPrice: number,
  sku: string
}

// const discountIcon = requireStatic('discount.png')
// const newIcon = requireStatic('new.png')
// const printerIcon = requireStatic('printer.webp')
const greenDot = requireStatic('green_dot.webp')
const redDot = requireStatic('red_dot.webp')

// function toImage(base64: string, type: 'jpg' | 'png' | 'webp') {
//   return `data:image/${type};base64, ${base64}`;
// }

class Landing extends React.Component<Props, State> {
  mainInputRef: React.RefObject<HTMLInputElement>;

  constructor(props: Props) {
    super(props)

    this.mainInputRef = React.createRef<HTMLInputElement>()

    this.state = {
      items: [{
        name: 'Gatorade',
        qty: 1,
        unitPrice: 3.89,
        sku: '12345678'
      }, {
        name: 'Powerade',
        qty: 2,
        unitPrice: 3.32,
        sku: '12345679'
      }],
      connStatus: true,
      skuInput: ''
    }

    Sys.battery(info => {
      if (info.hasbattery) {
        if (info.ischarging || info.percent === 100) this.setState({ batteryInfo: 'Charged' });
        else this.setState({ batteryInfo: info.percent });
      }
    });
  }

  componentDidMount() {
    try {
      let _win = remote.getCurrentWindow();
      if (!_win.isFullScreen()) {
        _win.setFullScreen(true)
      }
    } catch (err) {
      logErr(err as Error)
    }
  }

  searchProduct = (event: React.FormEvent<HTMLFormElement>) => {
    const { skuInput } = this.state;
    event.preventDefault();

    if (!skuInput)
      return;

    console.log('>> Searching...');
    let productDb = this.props.dbManager.getRepository(Product);
    productDb.findOneOrFail({
      where: [
        { sku: skuInput },
        { name: skuInput }
      ]
    })
      .then(product => console.log(product))
      .catch(() => console.log(`>> Product with SKU ${skuInput} wasn't found`));

    this.setState({ skuInput: '' })
  }

  checkConnection = () => {
    return new Promise<void>(() => {
      this.setState({ connStatus: true })
    });
  }

  formatReceipt = (params: { currency?: string, width?: number, ruler?: string }) => {
    let { items } = this.state

    items = items?.sort((a, b) => b.qty - a.qty)

    let subTotal = items ? items?.Sum(item => item.unitPrice * item.qty) : 0;
    let hst_gst = subTotal * 0.15;
    let total = subTotal + hst_gst;

    receipt.config.currency = params.currency || '$'
    receipt.config.width = params.width || 40
    receipt.config.ruler = params.ruler || '-'

    let output: string = receipt.create([
      {
        type: "text", value: [
          'TASTE EAST',
          '62 Allandale Rd',
          'taste.east@hotmail.com',
          'www.tasteeastnl.ca'
        ], align: "center"
      },
      { type: 'empty' },
      {
        type: 'properties', lines: [
          // { name: 'Date', value: new Date().toString("dd/MM/yyyy hh:mm tt") },
          { name: 'Date', value: '23/04/1995 12:04 PM' },
          { name: 'Order Number', value: "0123456789" }
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
        type: 'properties', lines: [
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
      { type: 'text', value: "Thank you for shopping at Taste East! If you have any requests or complains, don't forget to contact us. Have a great day!", align: 'center', padding: 5 },
      { type: 'empty' },
      { type: 'empty' }
    ])

    return output
  }

  printReceipt = () => {
    const { printer } = this.props;

    try {
      // get printer info
      let printerInfo = getPrinter('RECEIPT_PRINTER');

      // if printer is attempting to connect, don't push a new printing job
      if (printerInfo.options['printer-state-reasons'].includes('connecting-to-device'))
        return;

      let receiptText = this.formatReceipt({});
      console.log(receiptText);

      printer.print(receiptText);
      printer.cut();
      printer.execute();
    } catch (err) {
      logErr(err as Error);
    }
  }

  renderTable = () => {
    const { items, multiplier } = this.state;
    if (!items) return;

    return (
      <table className="table table-striped table-borderless w-100">
        <thead>
          <tr className="border-bottom">
            {/* <th className="text-center" style={{ width: "5%" }}>#</th> */}
            <th className="text-center" style={{ width: '50%' }}>Name</th>
            <th className="text-center">Qty</th>
            <th className="text-center">Unit Price</th>
            <th className="text-center">Total</th>
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
              </tr>
            )
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
    )
  }

  render() {
    const { items, connStatus, multiplier, skuInput } = this.state;

    let btnStyle: CSSProperties = { width: "55px" }
    let borderedBtn: CSSProperties = { borderBottom: '10px solid orange' }
    let redBtn: CSSProperties = {
      boxShadow: 'inset 0px 34px 0px -15px #b54b3a!important',
      backgroundColor: '#a73f2d',
      color: '#ffffff',
      textShadow: '3px 5px 3px #7a2a1d',
      display: 'inline-block'
    }

    let subTotal = items ? items?.Sum(item => item.unitPrice * item.qty) : 0;
    let hst_gst = subTotal * 0.15;
    let total = subTotal + hst_gst;

    return (
      <div className="vw-100 vh-100 bg-light d-flex flex-column">
        <div className="bg-dark d-flex flex-row-reverse" style={{ height: "35px" }}>
          <button className="btn btn-sm btn-icon">
            <FontAwesomeIcon icon={faStore} />{' '}StorePro
          </button>
          <button className="btn btn-sm btn-icon">
            <small className="text-monospace">Version: 0.0.2</small>
          </button>
          <button className="btn btn-sm btn-icon h-100">
            Connection: {' '}
            <img
              style={{ objectFit: 'cover', height: '50%', width: 'auto' }}
              src={connStatus ? greenDot : redDot}
              alt='status'
            />
          </button>
        </div>
        <div className=" flex-grow-1 d-flex h-100 w-100">
          <div className="d-flex flex-column h-100 border-right" style={{ width: '60vw' }}>
            <div className="flex-grow-1 py-2 w-100">
              <div className="d-flex justify-content-around w-100 py-4">
                {/* <button className="btn btn-lg py-3 px-4 btn-light shadow-tight" onClick={() => this.setState({ multiplier: undefined })}>
                  <FontAwesomeIcon icon={faRecycle} />
                </button> */}
                {Array.from({ length: 9 }, (n, k) => {
                  let btnClass = 'btn btn-lg py-3 px-4 btn-light shadow-tight'
                  if (multiplier && multiplier === k + 1) {
                    btnClass += `${btnClass} active`
                  }
                  return (
                    <button key={k} className={btnClass} onClick={() => {
                      if (multiplier === k + 1)
                        this.setState({ multiplier: undefined })
                      else
                        this.setState({ multiplier: k + 1 })

                      this.mainInputRef.current!.focus()
                    }}>
                      {k + 1}
                    </button>
                  )
                })}
              </div>
              <Scrollbars className="w-100 h-100">
                <div className="w-100 text-center border-bottom font-kulim text-uppercase">
                  <h5>Retail</h5>
                </div>
                <div className="d-flex flex-wrap justify-content-between align-items-center px-3">
                  <button className="shadow-tight btn p-3 m-2 btn-darker" style={borderedBtn}>
                    <img src={require("/Users/simanto_r/Projects/POS-X/POS Terminal/src/resources/discount.png")} alt="logo_png" style={btnStyle} />
                  </button>
                  <button className="shadow-tight btn p-3 m-2 btn-darker" style={borderedBtn}>
                    <img src={require("/Users/simanto_r/Projects/POS-X/POS Terminal/src/resources/new.png")} alt="logo_png" style={btnStyle} />
                  </button>
                  <button className="shadow-tight btn p-3 m-2 btn-darker" style={borderedBtn}>
                    <img src={require("/Users/simanto_r/Projects/POS-X/POS Terminal/src/resources/bill.png")} alt="logo_png" style={btnStyle} />
                  </button>
                  <button className="shadow-tight btn p-3 m-2 btn-darker" style={borderedBtn}>
                    <img src="https://image.flaticon.com/icons/png/512/1632/1632670.png" alt="logo_png" style={btnStyle} />
                  </button>
                  <button className="shadow-tight btn p-3 m-2 btn-darker" style={borderedBtn}>
                    <img src="https://image.flaticon.com/icons/png/512/138/138841.png" alt="logo_png" style={btnStyle} />
                  </button>
                  <button className="shadow-tight btn p-3 m-2 btn-darker" style={borderedBtn} onClick={this.printReceipt}>
                    <img src="https://img.icons8.com/cotton/64/000000/invoice.png" alt="logo_png" style={btnStyle} />
                  </button>
                  <button className="shadow-tight btn btn-success p-3 m-2">
                    <img src="https://cdn.pixabay.com/photo/2012/04/02/16/07/plus-24844_960_720.png" alt="add_item" style={btnStyle} />
                  </button>
                </div>
              </Scrollbars>
            </div>
            <div className="d-flex flex-row-reverse justify-content-around align-items-center py-2 border-top" style={{ minHeight: '18vh' }}>
              <button className="btn btn-xl btn-circle shadow-tight" style={redBtn} >
                <FontAwesomeIcon icon={faMoneyBill} />
              </button>
              <button className="btn btn-xl btn-circle text-white shadow-tight" style={{ textShadow: '3px 5px 3px #85684e', zIndex: 1, backgroundColor: '#c59b76' }}>
                <FontAwesomeIcon icon={faDatabase} />
              </button>
              <button className="btn btn-xl btn-circle text-white shadow-tight" style={{ textShadow: '3px 5px 3px #7b8052', zIndex: 1, backgroundColor: '#c0c781' }}>
                <FontAwesomeIcon icon={faMoneyBill} />
              </button>
              <button className="btn btn-xl btn-circle text-white shadow-tight" style={{ textShadow: '3px 5px 3px #7a4b41', zIndex: 1, backgroundColor: '#c17767' }}>
                <FontAwesomeIcon icon={faMoneyBill} />
              </button>
              <Link to="/settings" className="btn btn-xl btn-circle text-white shadow-tight d-flex align-items-center justify-content-center" style={{ textShadow: '3px 5px 3px #4a7485', zIndex: 1, backgroundColor: '#79bad4' }}>
                <FontAwesomeIcon icon={faCogs} />
              </Link>
            </div>
          </div>
          <div className="flex-grow-1 d-flex flex-column bg-light no-selection">
            <form className="d-flex py-2 font-kulim px-2" onSubmit={this.searchProduct}>
              <div className="form-inline w-100 mr-2">
                <input
                  autoFocus ref={this.mainInputRef} value={skuInput}
                  className="form-control bg-light shadow w-100"
                  type="text" name="search" placeholder="Barcode"
                  onChange={e => this.setState({ skuInput: e.currentTarget.value })}
                />
              </div>
              <button type="submit" className="btn btn-light shadow-tight">Search</button>
            </form>
            <div className="flex-grow-1">
              <Scrollbars className="w-100 h-100">
                <div className="p-3">
                  {this.renderTable()}
                </div>
              </Scrollbars>
            </div>
            <div className="d-flex flex-column w-100 px-2 border-top font-kulim" style={{ minHeight: '18vh' }}>
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
            {/* <ul className="mt-auto list-group list-group-flush font-kulim font-weight-bold">
              <li className="list-group-item list-group-item-dark d-flex justify-content-between">
                <h5>Sub Total</h5>
                <h5>$ {subTotal.toFixed(2)}</h5>
              </li>
              <li className="list-group-item list-group-item-dark d-flex justify-content-between">
                <h5>HST/GST</h5>
                <h5>$ {hst_gst.toFixed(2)}</h5>
              </li>
              <li className="list-group-item list-group-item-dark d-flex justify-content-between">
                <h5>Total</h5>
                <h5>$ {total.toFixed(2)}</h5>
              </li>
            </ul> */}
          </div>
        </div>
      </div >
    )
  }
}

export default Landing