import React, { Component } from 'react';
import { EntityManager, Like } from 'typeorm';
import { Product, getUnitType, UnitType, Order, OrderItem, OrderStatus, Supplier } from '../database/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import DatePicker from "react-datepicker";
import { ActionTypes } from 'react-select';
import AsyncSelect from 'react-select/async';
import AsyncCreate from 'react-select/async-creatable';
import { logErr } from '../system';
import Scrollbars from 'react-custom-scrollbars';
import 'react-datepicker/dist/react-datepicker.min.css';
import 'datejs';

interface Props {
    database: EntityManager
}

interface State {
    orderItems: Array<{
        product: Product,
        qty: number
    }>,
    newItem: {
        product: Product,
        qty: number
    },
    orderDetails: Partial<Order>,
    delivered: boolean
}

const emptyItem: Product = {
    name: '',
    sku: '',
    minStock: 0,
    tax: 1.15,
    costPrice: 0,
    unitType: UnitType.kg,
    qty: 0
}

const dateFormat = 'dd-MM-yyyy';

interface SelectValueType {
    label: string,
    value: {
        product: Product,
        qty: number
    }
}

interface KVPair<T1, T2> {
    label: T1,
    value: T2
}

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

    dummySubmit = () => {
        const { database } = this.props;
        const { orderItems, orderDetails } = this.state;

        orderItems.map(item => {
            database.create(Product, {
                ...item.product,
                costPrice: 10,
                minStock: 4
            })
        })
    }

    // submitOrder = () => {
    //     const { database } = this.props;
    //     const { orderItems, orderDetails } = this.state;

    //     const itemDetails = orderItems.map(item => {
    //         database.create(OrderItem, {
    //             order: order,
    //             product: Promise.resolve({ ...item.product, qty: item.qty, tax: 1.15 }),
    //             qty: item.qty
    //         });
    //     })
    //     const order = database.create(Order, { ...orderDetails, items: Promise.resolve(itemDetails) });

    //     database.save<Order>(order).catch((err: Error) => console.warn(err.message));
    // }

    render() {
        const { newItem, orderItems, orderDetails } = this.state;
        const { database } = this.props;

        const skuLoadOpts = (input: string, cb: any) => {
            database.find(Product, {
                where: { sku: Like(`${input}%`) },
                take: 5,
                order: { sku: 'ASC' }
            }).then(products => {
                const filtered = products.map((item) => ({
                    label: item.sku,
                    value: item.sku
                }));
                cb(filtered);
            }).catch((err: Error) => {
                logErr(err);
                console.error(err.message);
            });
        }

        const nameLoadOpts = (input: string, cb: any) => {
            database.find(Product, {
                where: { name: Like(`${input}%`) },
                take: 5,
                order: { sku: 'ASC' }
            }).then(products => {
                const filtered = products.map((item) => ({
                    label: `${item.name}`,
                    value: item
                }));
                cb(filtered);
            }).catch((err: Error) => {
                logErr(err);
                console.error(err.message);
            });
        }

        const supplierLoadOpts = (input: string, cb: any) => {
            database.findOneOrFail(Supplier, {
                where: { name: Like(`%${input}%`) }
            }).then(supplier => {
                cb({
                    label: `${supplier.name}`,
                    value: supplier
                });
            }).catch(err => {
                logErr(err);
            });
        }

        const dummyOpts = (input: string, cb: any) => {
            cb([{
                label: 'Option 1',
                value: 'Option 1'
            }, {
                label: 'Option 2',
                value: 'Option 2'
            }, {
                label: 'Option 3',
                value: 'Option 3'
            }]);
        }

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
                                loadOptions={dummyOpts}
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
                                            this.setState({ orderDetails: { ...orderDetails, orderDate: date } })
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
                                    onChange={date => this.setState({ orderDetails: { ...orderDetails, requiredDate: date! } })}
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
                                    onChange={date => this.setState({ orderDetails: { ...orderDetails, expectedDeliveryDate: date! } })}
                                />
                            </div>
                        </div>
                        <div className="col-1" />
                        <div className="col-2 d-flex justify-content-around align-items-center">
                            <div className="px-2 h-100">
                                <button className="btn btn-info btn-lg h-100 shadow-tight">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
                <Scrollbars className="w-100 h-100">
                    <table className="table table-striped">
                        <colgroup>
                            <col width="15%" />
                            <col width="15%" />
                            <col width="20%" />
                            <col width="10%" />
                            <col width="10%" />
                            <col width="10%" />
                            <col width="10%" />
                            <col width="10%" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>SKU*</th>
                                <th>Name*</th>
                                <th>Description</th>
                                <th>Unit*</th>
                                <th>Stock</th>
                                <th>Cost*</th>
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
                                        value={newItem.product.sku !== '' ? { label: newItem.product.sku, value: newItem.product.sku } : undefined}
                                        loadOptions={skuLoadOpts}
                                        backspaceRemovesValue
                                        placeholder="SKU"

                                        blurInputOnSelect
                                        defaultOptions
                                    />
                                </td>
                                <td>
                                    <AsyncCreate
                                        cacheOptions={false}
                                        classNamePrefix="form-control"
                                        value={newItem.product.name !== '' ? { label: newItem.product.name, value: newItem } : undefined}
                                        loadOptions={nameLoadOpts}
                                        backspaceRemovesValue
                                        placeholder="Name"
                                        onChange={(value: any, meta) => {
                                            switch (meta.action) {
                                                case "create-option":
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
                                                case "remove-value":
                                                    this.setState({ newItem: { ...newItem, product: emptyItem } });
                                                    break;
                                                case "select-option":
                                                    database.findOneOrFail(Product, {
                                                        where: { sku: value.label }
                                                    }).then(product => {
                                                        this.setState({
                                                            newItem: {
                                                                ...newItem,
                                                                product: product,
                                                                qty: 0
                                                            }
                                                        })
                                                    }).catch(err => console.log(err));
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
                                        placeholder='N/A'
                                        onChange={({ currentTarget: { value } }) => {
                                            newItem.product.description = value;
                                            this.setState({ newItem: newItem });
                                        }}
                                    />
                                </td>
                                <td>
                                    <select defaultValue={newItem.product.unitType} onChange={({ currentTarget: { value } }) => {
                                        newItem.product.unitType = parseInt(value);
                                        this.setState({ newItem: newItem });
                                    }} className="form-control">
                                        <option value={UnitType.kg}>kg</option>
                                        <option value={UnitType.lb}>lb</option>
                                        <option value={UnitType.gm}>gm</option>
                                        <option value={UnitType.ltr}>ltr</option>
                                    </select>
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
                                <td>
                                    <input type="text" value={newItem.product.qty} className="form-control" readOnly />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="form-control disabled"
                                        min={1}
                                        value={newItem.qty}
                                        onChange={({ currentTarget: { valueAsNumber } }) => {
                                            newItem.qty = valueAsNumber;
                                            this.setState({ newItem: newItem });
                                        }}
                                    />
                                </td>
                                <td className="text-center">
                                    <button type="button" className="btn btn-success shadow-tight" onClick={() => {
                                        orderItems.push(newItem);
                                        this.setState({
                                            orderItems: orderItems,
                                            newItem: { product: emptyItem, qty: 0 }
                                        });
                                    }}>
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </td>
                            </tr>
                            {orderItems.map(({ product, qty }, i) => (
                                <tr key={i}>
                                    <td>{product.sku}</td>
                                    <td>{product.name}</td>
                                    <td>{product.description ?? 'N/A'}</td>
                                    <td>{getUnitType(product.unitType)}</td>
                                    <td>{product.qty}</td>
                                    <td>{qty}</td>
                                    <td className="text-center">
                                        <button className="btn btn-danger shadow-tight" onClick={() => {
                                            orderItems.splice(i, 1);
                                            this.setState({ orderItems: orderItems });
                                        }}>
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Scrollbars>
            </div >
        )
    }
}

export default AddToInventory;