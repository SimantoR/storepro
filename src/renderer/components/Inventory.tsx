import React, { Component } from 'react';
import { EntityManager } from 'typeorm';
import Scrollbars from 'react-custom-scrollbars';
import ReactLoading from 'react-loading';
import { Product } from '../database/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'datejs';
import {
  faCog,
  faPlus,
  faListUl,
  faFileExcel,
  faArrowLeft,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';

interface Props {
  dbManager: EntityManager
}

interface State {
  items: Product[],
  selected: boolean[]
}

class Inventory extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      items: [],
      selected: []
    }
  }

  componentDidMount() {
    const { dbManager } = this.props;
    let productRepo = dbManager.getRepository(Product);
    productRepo.find({
      cache: false,
      take: 10
    }).then(products => {
      console.log(products);
      this.setState({
        items: products,
        selected: Array.from({ length: products.length }, () => false)
      });
    });
  }

  handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  }

  render() {
    const { items, selected } = this.state;

    if (items.length === 0) {
      return (
        <div className="w-100 h-100 d-flex">
          <ReactLoading type={'bubbles'} />
        </div>
      )
    }

    return (
      <div className="w-100 h-100 d-flex flex-column">
        <div className="p-2 d-flex justify-content-center btn-toolbar w-auto border-bottom">
          <button className="btn btn-light btn-circle btn-lg shadow-tight">
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button className="btn btn-light btn-circle btn-lg shadow-tight">
            <FontAwesomeIcon icon={faListUl} />
          </button>
          <button className="btn btn-light btn-circle btn-lg shadow-tight">
            <FontAwesomeIcon icon={faFileExcel} />
          </button>
          <button className="ml-auto btn btn-circle btn-lg btn-light shadow-tight">
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>
        <div className="flex-grow-1 p-2">
          <Scrollbars className="w-100 h-100 d-flex">
            <table className="table table-striped table-borderless">
              <thead className="shadow-tight">
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selected.All(x => x === true)}
                      onChange={({ currentTarget: { checked } }) => this.setState({ selected: selected.fill(checked) })}
                    />
                  </th>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Created On</th>
                  <th>Last Modified</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x, i) => (
                  <tr key={i}>
                    <td><input type="checkbox" checked={selected[i]} onChange={({ currentTarget: { checked } }) => {
                      selected[i] = checked;
                      this.setState({ selected: selected });
                    }} /></td>
                    <td>{x.sku}</td>
                    <td><b>{x.name}</b></td>
                    <td>{x.creationDate.toString('MMM dd, yyyy')}</td>
                    <td>{x.modificationDate.toString('MMM dd, yyyy')}</td>
                    <td>{x.costPrice}</td>
                    <td>{x.sellPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scrollbars>
        </div>
        {items.length > 0 && (
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <div className="p-2 d-flex justify-content-center btn-toolbar w-auto border-bottom">
              <button className="btn btn-light btn-circle btn-lg shadow-tight">
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <button className="btn btn-light btn-circle btn-lg shadow-tight">
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Inventory;