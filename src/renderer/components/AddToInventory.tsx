import React, { Component } from 'react';
import { EntityManager, Like } from 'typeorm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faPercent } from '@fortawesome/free-solid-svg-icons';
import DatePicker from 'react-datepicker';
import AsyncSelect from 'react-select/async';
import AsyncCreate from 'react-select/async-creatable';
import { logErr } from '../tools/system';
import Scrollbars from 'react-custom-scrollbars';
import 'react-datepicker/dist/react-datepicker.min.css';
import 'datejs';
import {
  Product,
  getUnitType,
  UnitType,
  Order,
  OrderItem,
  OrderStatus,
  Supplier
} from '../database/database';

interface Props {
  database: EntityManager;
}

interface State {
  orderItems: Array<{
    product: Partial<Product>;
    qty: number;
  }>;
  newItem: {
    product: Partial<Product>;
    qty: number;
  };
  orderDetails: Partial<Order>;
  delivered: boolean;
}

const emptyItem: Product = {
  name: '',
  sku: '',
  minStock: 0,
  tax: 1.15,
  costPrice: 0,
  unitType: UnitType.kg,
  qty: 0
};

const dateFormat = 'dd-MM-yyyy';

class AddToInventory extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      orderItems: [],
      newItem: {
        product: emptyItem,
        qty: 0
      },
      orderDetails: {
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        requiredDate: new Date(),
        status: OrderStatus.pending
      },
      delivered: false
    };
  }

  addToOrder = () => {
    const { newItem, orderItems } = this.state;

    // if the product is already added, sum up quantity
    if (orderItems.Any(x => x.product.sku === newItem.product.sku)) {
      console.log('Found already existing product');
      let item = orderItems
        .Where(x => x.product.sku === newItem.product.sku)
        .First();
      let index = orderItems.indexOf(item);

      console.log(index);

      item = {
        ...newItem,
        qty: item.qty + newItem.qty
      };

      orderItems[index] = item;
    }
    // else just add the new item to order
    else {
      orderItems.push(newItem);
    }

    this.setState({
      orderItems: orderItems,
      newItem: { product: emptyItem, qty: 0 }
    });
  };

  submitInventory = () => {
    const { database } = this.props;
    const { orderItems } = this.state;

    const products = orderItems.map(({ product, qty }) => {
      return database.create(Product, { ...product, qty: (product.qty || 0) + qty });
    });

    database.save<Product>(products)
      .catch((err: Error) => console.warn(err.message))
      .then(() => {
        this.setState({ newItem: { product: emptyItem, qty: 0 }, orderItems: [] });
      });
  }

  submitOrder = async () => {
    const { database } = this.props;
    const { orderItems: itemDetails, orderDetails } = this.state;

    let order = database.create(Order, {
      ...orderDetails,
      supplier: database.create(Supplier, {
        name: 'Main Supplier',
        address: 'Somewhere',
        email: 'something@something.com'
      })
    });

    order = await database.save(Order, order);

    let orderItems: OrderItem[] = itemDetails.map(({ product, qty }) => {
      return database.create(OrderItem, {
        order: order,
        product: database.create(Product, { ...product }),
        qty: qty
      });
    });

    orderItems = await database.save(OrderItem, orderItems);
  };

  render() {
    const { newItem, orderItems, orderDetails } = this.state;
    const { database } = this.props;

    const skuLoadOpts = (input: string, cb: any) => {
      database
        .find(Product, {
          where: { sku: Like(`${input}%`) },
          take: 5,
          order: { sku: 'ASC' }
        })
        .then(products => {
          const filtered = products.map(item => ({
            label: item.sku,
            value: item.sku
          }));
          cb(filtered);
        })
        .catch((err: Error) => {
          logErr(err);
          console.error(err.message);
        });
    };

    const nameLoadOpts = (input: string, cb: any) => {
      database
        .find(Product, {
          where: { name: Like(`${input}%`) },
          take: 5,
          order: { sku: 'ASC' }
        })
        .then(products => {
          const filtered = products.map(item => ({
            label: item.name,
            value: item
          }));
          cb(filtered);
        })
        .catch((err: Error) => {
          logErr(err);
          console.error(err.message);
        });
    };

    const supplierLoadOpts = (input: string, cb: any) => {
      database
        .findOneOrFail(Supplier, {
          where: { name: Like(`%${input}%`) }
        })
        .then(supplier => {
          cb({
            label: `${supplier.name}`,
            value: supplier
          });
        })
        .catch(err => {
          logErr(err);
        });
    };

    return (
      <div className="w-100 h-100 d-flex flex-column">
        <div className="w-100 p-2">
          <div className="row w-100">
            <div className="col-2">
              <label>Supplier</label>
              <AsyncSelect
                cacheOptions={false}
                classNamePrefix="form-control"
                backspaceRemovesValue
                loadOptions={supplierLoadOpts}
              />
            </div>
            <div className="col-1" />
            <div className="col-2">
              <label>Requested On</label>
              <div>
                <DatePicker
                  dateFormat={dateFormat}
                  className="form-control"
                  minDate={new Date()}
                  disabled
                  selected={orderDetails.orderDate}
                  onChange={date => {
                    if (date)
                      this.setState({
                        orderDetails: { ...orderDetails, orderDate: date }
                      });
                  }}
                />
              </div>
            </div>
            <div className="col-2">
              <label>Required On</label>
              <div>
                <DatePicker
                  dateFormat={dateFormat}
                  className="form-control"
                  minDate={new Date()}
                  selected={orderDetails.requiredDate}
                  onChange={date =>
                    this.setState({
                      orderDetails: { ...orderDetails, requiredDate: date! }
                    })
                  }
                />
              </div>
            </div>
            <div className="col-2">
              <label>Expected On</label>
              <div>
                <DatePicker
                  dateFormat={dateFormat}
                  className="form-control w-100"
                  minDate={new Date()}
                  selected={orderDetails.expectedDeliveryDate}
                  onChange={date =>
                    this.setState({
                      orderDetails: {
                        ...orderDetails,
                        expectedDeliveryDate: date!
                      }
                    })
                  }
                />
              </div>
            </div>
            <div className="col-1" />
            <div className="col-2 d-flex justify-content-around align-items-center">
              <div className="px-2 h-100">
                <button
                  onClick={this.submitInventory}
                  className="btn btn-info btn-lg h-100 shadow-tight"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
        <Scrollbars className="w-100 h-100">
          <table className="table table-striped">
            <colgroup>
              <col width="15%" />
              <col width="15%" />
              <col width="21%" />
              <col width="9%" />
              <col width="9%" />
              <col width="9%" />
              <col width="9%" />
              <col width="9%" />
              <col width="9%" />
            </colgroup>
            <thead>
              <tr>
                <th>SKU*</th>
                <th>Name*</th>
                <th>Description</th>
                <th>Unit*</th>
                <th>Stock</th>
                <th>Cost*</th>
                <th>Tax</th>
                <th>Qty*</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <AsyncCreate
                    cacheOptions={false}
                    classNamePrefix="form-control"
                    value={
                      newItem.product.sku !== ''
                        ? {
                          label: newItem.product.sku,
                          value: newItem.product.sku
                        }
                        : null
                    }
                    loadOptions={skuLoadOpts}
                    backspaceRemovesValue
                    placeholder="SKU"
                    onChange={(value: any, meta) => {
                      switch (meta.action) {
                        case 'create-option':
                          this.setState({
                            newItem: {
                              ...newItem,
                              product: {
                                ...newItem.product,
                                sku: value.label
                              }
                            }
                          });
                          break;
                        case 'remove-value':
                          this.setState({
                            newItem: { ...newItem, product: emptyItem }
                          });
                          break;
                        case 'select-option':
                          database
                            .findOneOrFail(Product, {
                              where: { sku: value.label }
                            })
                            .then(product => {
                              this.setState({
                                newItem: {
                                  ...newItem,
                                  product: product,
                                  qty: 0
                                }
                              });
                            })
                            .catch(err => console.log(err));
                          break;
                        default:
                          break;
                      }
                    }}
                    blurInputOnSelect
                    defaultOptions
                  />
                </td>
                <td>
                  <AsyncCreate
                    cacheOptions={false}
                    classNamePrefix="form-control"
                    value={
                      newItem.product.name !== ''
                        ? { label: newItem.product.name, value: newItem }
                        : null
                    }
                    loadOptions={nameLoadOpts}
                    backspaceRemovesValue
                    placeholder="Name"
                    onChange={(value: any, meta) => {
                      switch (meta.action) {
                        case 'create-option':
                          this.setState({
                            newItem: {
                              ...newItem,
                              product: {
                                ...newItem.product,
                                name: value.label
                              }
                            }
                          });
                          break;
                        case 'remove-value':
                          this.setState({
                            newItem: { ...newItem, product: emptyItem }
                          });
                          break;
                        case 'select-option':
                          database
                            .findOneOrFail(Product, {
                              where: { name: value.label }
                            })
                            .then(product => {
                              this.setState({
                                newItem: {
                                  ...newItem,
                                  product: product,
                                  qty: 0
                                }
                              });
                            })
                            .catch(err => console.log(err));
                          break;
                        default:
                          break;
                      }
                    }}
                    blurInputOnSelect
                    defaultOptions
                  />
                </td>
                <td>
                  <input
                    className="form-control"
                    value={newItem.product.description ?? ''}
                    placeholder="N/A"
                    onChange={({ currentTarget: { value } }) => {
                      newItem.product.description = value;
                      this.setState({ newItem: newItem });
                    }}
                  />
                </td>
                <td>
                  <select
                    defaultValue={newItem.product.unitType}
                    value={newItem.product.unitType}
                    onChange={({ currentTarget: { value } }) => {
                      this.setState({ newItem: { ...newItem, product: { ...newItem.product, unitType: parseInt(value) } } });
                    }}
                    className="form-control"
                  >
                    <option value={UnitType.kg}>kg</option>
                    <option value={UnitType.lb}>lb</option>
                    <option value={UnitType.gm}>gm</option>
                    <option value={UnitType.ltr}>ltr</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    readOnly
                    value={newItem.product.qty}
                    className="form-control"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    value={newItem.product.costPrice}
                    onChange={({ currentTarget: { valueAsNumber } }) => {
                      newItem.product.costPrice = valueAsNumber;
                      this.setState({ newItem: newItem });
                    }}
                  />
                </td>
                <td className="input-group">
                  {/* <div className="input-group-prepend">
                    <div className="input-group-text">
                      <FontAwesomeIcon icon={faPercent} />
                    </div>
                  </div> */}
                  <input
                    type="number"
                    className="form-control"
                    value={newItem.product.tax}
                    onChange={({ currentTarget: { valueAsNumber } }) => {
                      this.setState({
                        newItem: {
                          ...newItem,
                          product: {
                            ...newItem.product,
                            tax: valueAsNumber
                          }
                        }
                      })
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    value={newItem.qty}
                    onChange={({ currentTarget: { valueAsNumber, value } }) => {
                      if (value === '') {
                        this.setState({ newItem: { ...newItem, qty: 0 } });
                      } else {
                        newItem.qty = valueAsNumber ?? 0;
                        this.setState({ newItem: newItem });
                      }
                    }}
                  />
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    className="btn btn-success shadow-tight"
                    onClick={this.addToOrder}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </td>
              </tr>
              {orderItems.map(({ product, qty }, i) => (
                <tr key={i}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.description ?? 'N/A'}</td>
                  <td>{getUnitType(product.unitType ?? 0)}</td>
                  <td>{product.costPrice}</td>
                  <td>{product.qty}</td>
                  <td>{qty}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-danger shadow-tight"
                      onClick={() => {
                        orderItems.splice(i, 1);
                        this.setState({ orderItems: orderItems });
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Scrollbars>
      </div>
    );
  }
}

export default AddToInventory;
