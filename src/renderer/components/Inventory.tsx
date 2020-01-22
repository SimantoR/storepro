import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Scrollbars from 'react-custom-scrollbars';
import ReactLoading from 'react-loading';
import { Product } from '../database/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EntityManager } from 'typeorm';
import { logErr } from '../system';
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

interface Props {
  database: EntityManager
}

interface State {
  items?: Product[],
  selected: boolean[],
  paging: {
    page: number,
    totalItems: number
  },
  hoverElem?: JSX.Element
}

class InventoryPage extends Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      selected: [],
      paging: {
        page: 1,
        totalItems: 0
      }
    }
  }

  componentDidMount() {
    const { database } = this.props;
    const { paging } = this.state;

    database.find(Product, {
      cache: false,
      take: 10,
      skip: (paging.page - 1) * 10
    }).then(async (products) => {
      this.setState({
        items: products,
        selected: Array.from({ length: products.length }, () => false)
      });
    });
  }

  loadInventory = () => {
    const { database } = this.props;

    database.find(Product, {
      cache: false,
      take: 10
    }).then(products => {
      this.setState({
        items: products,
        selected: Array.from({ length: products.length }, () => false)
      });
    })
  }

  render() {
    const { items, selected, paging: { page }, hoverElem } = this.state;

    if (!items) {
      return (
        <div className="w-100 h-100 d-flex justify-content-center align-items-center">
          <ReactLoading type='bubbles' color='#000000' width={'15%'} height={'15%'} />
        </div>
      )
    }

    return (
      <div className="w-100 h-100 d-flex flex-column">
        {hoverElem && (
          <div className="d-flex align-items-center justify-content-center w-100 h-100" style={{ position: 'absolute', left: 0, zIndex: 1, background: 'rgba(0, 0, 0, 0.4)' }}>
            {hoverElem}
          </div>
        )}
        <div className="p-2 d-flex justify-content-between align-items-center w-100 border-bottom">
          <div className="btn-toolbar w-100 justify-content-start">
            <Link to="/settings/inventory/add" className="btn btn-light btn-circle btn-lg shadow-tight d-flex justify-content-center align-items-center">
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
            <button className="btn btn-light btn-circle btn-lg shadow-tight">
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <big className="h-75 btn btn-light rounded-pill d-flex shadow-tight" style={{ cursor: 'default' }}>
              <b className="align-self-center font-kulim h4 my-1">{page}</b>
            </big>
            <button className="btn btn-light btn-circle btn-lg shadow-tight">
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <div className="btn-toolbar w-100 justify-content-end">
            <button className="btn btn-light btn-circle btn-lg shadow-tight">
              <FontAwesomeIcon icon={faDownload} />
            </button>
            <button className="btn btn-circle btn-lg btn-light shadow-tight">
              <FontAwesomeIcon icon={faCog} />
            </button>
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
                        onChange={({ currentTarget: { checked } }) => this.setState({ selected: selected.fill(checked) })}
                      />
                    </th>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Minimum</th>
                    <th>Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0
                    ? items.map((item, i) => (
                      <tr key={i} className="text-center">
                        <td><input type="checkbox" checked={selected[i]} onChange={({ currentTarget: { checked } }) => {
                          selected[i] = checked;
                          this.setState({ selected: selected });
                        }} /></td>
                        <td>{item.sku}</td>
                        <td><b>{item.name}</b></td>
                        <td>{item.description ?? 'N/A'}</td>
                        <td>{item.qty}</td>
                        <td>{item.minStock}</td>
                        <td>{((item.tax - 1) * 100).toFixed(0)}%</td>
                      </tr>
                    )) : (
                      <p>No Data Found</p>
                    )
                  }
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