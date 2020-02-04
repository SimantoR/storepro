import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Scrollbars from 'react-custom-scrollbars';
import ReactLoading from 'react-loading';
import { Product } from '../database/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EntityManager, MoreThan } from 'typeorm';
import { logErr } from '../system';
import { remote } from 'electron';
import * as fs from 'fs';
import 'datejs';
import {
  faCog,
  faPlus,
  faDownload,
  faArrowLeft,
  faArrowRight,
  faMailBulk,
  faRedo
} from '@fortawesome/free-solid-svg-icons';
import Button from './Button';

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
  constructor(props: Props) {
    super(props);
    this.state = {
      selected: [],
      paging: {
        page: 1,
        totalItems: 0
      }
    };
  }

  componentDidMount() {
    const { database } = this.props;
    const { paging } = this.state;

    database
      .find(Product, {
        cache: false,
        take: 10,
        skip: (paging.page - 1) * 10
      })
      .then(async products => {
        this.setState({
          items: products,
          selected: Array.from({ length: products.length }, () => false)
        });
      });
  }

  loadInventory = () => {
    const { database } = this.props;

    database
      .find(Product, {
        take: 10,
        where: { qty: MoreThan(0) },
        order: { sku: 'ASC' }
      })
      .then(products => {
        if (products) {
          this.setState({
            items: products,
            selected: Array.from({ length: products.length }, () => false)
          });
        }
      });
  };

  exportToCsv = async () => {
    const { items } = this.state;

    if (!items) return;

    let fStream: fs.WriteStream;

    // get access to file
    {
      const window = remote.getCurrentWindow();
      const { filePath, canceled } = await remote.dialog.showSaveDialog(
        window,
        {
          buttonLabel: 'Save',
          title: 'Save CSV',
          nameFieldLabel: 'export',
          filters: [{ extensions: ['csv', 'xlsx'], name: 'Excel' }]
        }
      );
      console.log(filePath);
      if (canceled || !filePath) return;
      fStream = fs.createWriteStream(filePath, {
        encoding: 'utf8',
        flags: 'a+'
      });
    }

    // convert data to csv //
    fStream.write('SKU,Name,Tax,Qty', 'utf8');
    items.forEach(item => {
      const txtLine = `\n${item.sku},${item.name},${item.tax},${item.qty}`;
      fStream.write(txtLine, 'utf8');
    });

    fStream.close();
  };

  render() {
    const {
      items,
      selected,
      paging: { page },
      hoverElem
    } = this.state;

    if (!items) {
      return (
        <div className="w-100 h-100 d-flex justify-content-center align-items-center">
          <ReactLoading
            type="bubbles"
            color="#000000"
            width={'15%'}
            height={'15%'}
          />
        </div>
      );
    }

    return (
      <div className="w-100 h-100 d-flex flex-column">
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
        <div className="p-2 d-flex justify-content-between align-items-center w-100 border-bottom">
          <div className="btn-toolbar w-100 justify-content-start">
            <Link
              to="/settings/inventory/add"
              className="btn btn-light btn-circle btn-lg shadow-tight d-flex justify-content-center align-items-center"
            >
              <FontAwesomeIcon icon={faPlus} />
            </Link>
            <button className="btn btn-light btn-circle btn-lg shadow-tight">
              <FontAwesomeIcon icon={faMailBulk} />
            </button>
            <button className="btn btn-light btn-circle btn-lg shadow-tight">
              <FontAwesomeIcon icon={faRedo} onClick={this.loadInventory} />
            </button>
          </div>
          <div className="btn-toolbar w-100 align-items-center justify-content-center">
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
          </div>
          <div className="btn-toolbar w-100 justify-content-end">
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
          <div className="flex-grow-1 p-2">
            <Scrollbars className="w-100 h-100 d-flex">
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
                  {items.length > 0 ? (
                    items.map((item, i) => (
                      <tr key={i} className="text-center">
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
                        <td>{item.costPrice}</td>
                        <td>{((item.tax - 1) * 100).toFixed(0)}%</td>
                      </tr>
                    ))
                  ) : (
                    <p>No Data Found</p>
                  )}
                </tbody>
              </table>
            </Scrollbars>
          </div>
        )}
      </div>
    );
  }
}

export default InventoryPage;
