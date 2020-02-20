import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Scrollbars from 'react-custom-scrollbars';
import ReactLoading from 'react-loading';
import { Product } from '../database/database';
import { round } from 'mathjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import InfiniScroll from '../components/InfiniScroll';
import { EntityManager, MoreThan } from 'typeorm';
import * as fs from 'promise-fs';
import toCsv from 'csv-stringify';
import { remote } from 'electron';
import Button from '../components/Button';
import 'datejs';
import {
  faCog,
  faPlus,
  faDownload,
  faArrowLeft,
  faArrowRight,
  faMailBulk,
  faRedo,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';

interface Props {
  database: EntityManager;
}

interface State {
  items?: Product[];
  selected: boolean[];
  paging: {
    page: number;
    totalItems: number;
  };
  hoverElem?: JSX.Element;
}

class InventoryPage extends Component<Props, State> {
  state: State = {
    selected: [],
    paging: {
      page: 0,
      totalItems: 0
    }
  }

  refList = {
    scrollable: React.createRef<Scrollbars>()
  }

  componentDidMount() {
    this.loadInventory();
  }

  componentWillUnmount() {

  }

  loadInventory = () => {
    const { database } = this.props;
    let { paging } = this.state;

    paging.page += 1;

    /**
     * fetch from database
     */
    const getData = () => {
      database
        .find(Product, {
          where: { qty: MoreThan(0) },
          order: { sku: 'ASC' }
        })
        .then(products => {
          if (products) {
            this.setState(prevState => ({
              items: products,
              selected: Array.from({ length: products.length }, () => false)
            }));
          }
        });
    }

    /**
     * Produces dummy data
     */
    const getDummyData = () => {
      const dummyData = Array.from({ length: 25 }, (_, i) => ({
        sku: i.toString().padStart(8, '0'),
        name: `Product ${i}`,
        costPrice: 2.14 * (i + 1),
        minStock: 2 * (i + 1),
        qty: 5 * (i + 1),
        tax: 0.15,
        unitType: 0
      } as Product));
      debugger;
      this.setState(prevState => ({
        items: prevState.items ? prevState.items.concat(dummyData) : dummyData,
        paging: { ...paging, page: paging.page },
        selected: Array.from({ length: dummyData.length }, () => false)
      }));
    }

    getData();
    // getDummyData();
  };

  deleteItems = () => {
    const { selected, items } = this.state;
    const { database } = this.props;

    if (!items) return;

    let tasks: Promise<any>[] = []

    selected.forEach((s, i) => {
      if (s) {
        tasks.push(database.remove<Product>(items[i]));
      }
    });

    Promise.all(tasks)
      .then(() => this.loadInventory())
      .catch((err: Error) => console.warn(err.message));
  }

  exportToCsv = async () => {
    const { items, selected } = this.state;

    if (!items) { // if there are no items, do nothing
      console.log(items);
      return;
    }

    // get access to file
    const openPrompt = (): Promise<any> => {
      return new Promise(async (resolve, reject) => {
        console.log('Opening dialog');
        const window = remote.getCurrentWindow();
        const { filePath, canceled } = await remote.dialog.showSaveDialog(
          window,
          {
            buttonLabel: 'Save',
            title: 'Save CSV',
            filters: [{
              name: 'Excel File',
              extensions: ['csv', 'xlsx']
            }, {
              name: 'Text File',
              extensions: ['txt', 'docx']
            }],
            showsTagField: false,
            nameFieldLabel: 'export',
          }
        );
        // if the save dialog is closed or no filepath is returned, do nothing
        if (canceled || !filePath) {
          reject();
        }

        // create a write stream to filepath
        resolve(fs.createWriteStream(
          filePath!,
          {
            encoding: 'utf8',
            flags: 'w+'
          }
        ));
      })
    }

    let selectedItems: Product[] = []

    selected.forEach((checked, i) => {
      if (checked) {
        selectedItems.push(items[i]);
      }
    });

    // if there are no selected items, do nothing
    if (selectedItems.length === 0) {
      const window = remote.getCurrentWindow();
      const buttons = ['Go Back', 'Export All']

      const {
        checkboxChecked,
        response: btnId
      } = await remote.dialog.showMessageBox(
        window,
        {
          message: 'Please select items',
          buttons: buttons,
          cancelId: 0,
          defaultId: 0
        }
      );

      switch (btnId) {
        case 0:
          return;
        case 1:
          console.log('Exporting all...');
          selectedItems = items
          break;

        default:
          break;
      }
    }

    let fStream: fs.WriteStream | undefined = await openPrompt();

    if (!fStream) return;

    selectedItems.forEach(_item => {
      _item.costPrice = round(_item.costPrice, 2);
    });

    // convert data to csv
    const stringifier = toCsv(selectedItems, {
      header: true,
      columns: [
        { key: 'sku', header: 'SKU' },
        { key: 'name', header: 'Name' },
        { key: 'tax', header: 'Tax' },
        { key: 'costPrice', header: 'Cost Price' },
        { key: 'minStock', header: 'Min Stock' },
        { key: 'qty', header: 'Quantity' }
      ]
    });

    // write csv data to filestream
    stringifier.pipe(fStream, { end: true });
  };

  loadableTable = () => {
    const {
      items,
      selected
    } = this.state;

    if (!items) return null;

    return (
      <InfiniScroll
        onScrollEnd={this.loadInventory}
        style={{ maxHeight: '100%', overflowY: 'scroll' }}
        onLoading={(
          <div className="w-100 d-flex justify-content-center">
            <ReactLoading type="bars" color="black" />
          </div>
        )}
      >
        <table className="table table-striped">
          <thead className="shadow-tight">
            <tr className="text-center">
              <th>
                <input
                  type="checkbox"
                  checked={selected.All(x => x === true)}
                  onChange={({ currentTarget: { checked } }) =>
                    this.setState({ selected: selected.fill(checked) })
                  }
                />
              </th>
              <th>SKU</th>
              <th>Name</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Minimum</th>
              <th>Cost</th>
              <th>Tax</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((item, i) => (
                <tr key={i} className="text-center" style={item.qty < item.minStock ? { background: 'rgba(186, 0, 0, 0.1)' } : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected[i]}
                      onChange={({ currentTarget: { checked } }) => {
                        selected[i] = checked;
                        this.setState({ selected: selected });
                      }}
                    />
                  </td>
                  <td>{item.sku}</td>
                  <td>
                    <b>{item.name}</b>
                  </td>
                  <td>{item.description ?? 'N/A'}</td>
                  <td>{item.qty}</td>
                  <td>{item.minStock}</td>
                  <td>{item.costPrice.toFixed(2)}</td>
                  <td>{(item.tax * 100).toFixed(2)}%</td>
                </tr>
              ))
            ) : (
                <p>No Data Found</p>
              )}
          </tbody>
        </table>
      </InfiniScroll>
    )
  };

  render() {
    const {
      items,
      paging: { page },
      hoverElem
    } = this.state;

    return (
      <div className="w-100 h-100 d-flex flex-column vh-100">
        {hoverElem && (
          <div
            className="d-flex align-items-center justify-content-center w-100 h-100"
            style={{
              position: 'absolute',
              left: 0,
              zIndex: 1,
              background: 'rgba(0, 0, 0, 0.4)'
            }}
          >
            {hoverElem}
          </div>
        )}
        <div
          className="p-2 d-flex justify-content-between align-items-center w-100 border-bottom"
        >
          <div className="btn-toolbar w-100 justify-content-start">
            <Link
              to="/settings/inventory/add"
              className="btn btn-light btn-circle btn-lg shadow-tight d-flex justify-content-center align-items-center"
            >
              <FontAwesomeIcon icon={faPlus} />
            </Link>
            <Button className="btn btn-light btn-circle btn-lg shadow-tight" onClick={this.deleteItems}>
              <FontAwesomeIcon icon={faTrashAlt} />
            </Button>
            <Button className="btn btn-light btn-circle btn-lg shadow-tight">
              <FontAwesomeIcon icon={faRedo} onClick={this.loadInventory} />
            </Button>
          </div>
          {/* <div className="btn-toolbar w-100 align-items-center justify-content-center">
            <Button className="btn btn-light btn-circle btn-lg shadow-tight">
              <FontAwesomeIcon icon={faArrowLeft} />
            </Button>
            <big
              className="h-75 btn btn-light rounded-pill d-flex shadow-tight"
              style={{ cursor: 'default' }}
            >
              <b className="align-self-center font-kulim h4 my-1">{page}</b>
            </big>
            <Button className="btn btn-light btn-circle btn-lg shadow-tight">
              <FontAwesomeIcon icon={faArrowRight} />
            </Button>
          </div> */}
          <div className="btn-toolbar w-100 justify-content-end">
            <Button className="btn btn-light btn-circle btn-lg shadow-tight">
              <FontAwesomeIcon icon={faMailBulk} />
            </Button>
            <Button
              audioSrc={require('../resources/btn_audio.wav')}
              className="btn btn-light btn-circle btn-lg shadow-tight"
              onClick={this.exportToCsv}
            >
              <FontAwesomeIcon icon={faDownload} />
            </Button>
            <Button className="btn btn-circle btn-lg btn-light shadow-tight">
              <FontAwesomeIcon icon={faCog} />
            </Button>
          </div>
        </div>
        {items && (
          <this.loadableTable />
        )}
      </div>
    );
  }
}

export default InventoryPage;
