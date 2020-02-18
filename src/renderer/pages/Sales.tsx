import React, { Component } from 'react';
import { Transaction, Product } from '../database/database';
import { EntityManager } from 'typeorm';
import 'datejs';
import { faTimes, faPrint, faRedo, faLock } from '@fortawesome/free-solid-svg-icons';
import Button from '../components/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface IProps {
  database: EntityManager;
}

interface IState {
  transactions: Transaction[];
}

class Sales extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      transactions: []
    };
  }

  componentDidMount() {
    const { database } = this.props;

    database
      .find(Transaction, {
        order: { timestamp: 'ASC' },
        take: 10
      })
      .then(transactions => {
        if (transactions.length !== 0) {
          this.setState({ transactions: transactions });
        }
      })
      .catch((err: Error) => console.warn(err.message));
  }

  printReceipt = (index: number) => {
    console.log('Printing receipt...');

    const transaction = this.state.transactions[index];
  };

  render() {
    const { transactions } = this.state;
    return (
      <table className="table table-striped table-borderless text-center align-content-center">
        <colgroup>
          <col width="5%" />
          <col width="25%" />
          <col width="10%" />
          <col width="15%" />
          <col width="15%" />
          <col width="30%" />
        </colgroup>
        <thead>
          <tr>
            <th>id</th>
            <th>Timestamp</th>
            <th>Price</th>
            <th>Paid Amount</th>
            <th>Payment Method</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i}>
              <td>{t.id}</td>
              <td className="text-monospace">
                {t.timestamp.toString('MMM dd, yyyy hh:mm:ss tt')}
              </td>
              <td>&#36; {t.price.toFixed(2)}</td>
              <td>&#36; {t.paid.toFixed(2)}</td>
              <td>
                <select
                  disabled
                  value={t.paymentMethod ?? 0}
                  className="form-control"
                >
                  <option value={0}>Cash</option>
                  <option value={1}>Debit Card</option>
                  <option value={2}>Credit Card</option>
                </select>
              </td>
              <td className="d-flex justify-content-around">
                <Button
                  className="btn btn-red btn-circle"
                  onClick={() => {
                    const item = transactions.splice(i, 1);
                    this.props.database
                      .remove(item)
                      .then(() => this.setState({ transactions: transactions }))
                      .catch(err => console.log(err));
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
                <Button
                  className="btn btn-info btn-circle shadow-tight"
                  onClick={() => this.printReceipt(i)}
                >
                  <FontAwesomeIcon icon={faPrint} />
                </Button>
                <Button className="btn btn-warning btn-circle shadow-tight">
                  <FontAwesomeIcon icon={faRedo} />
                </Button>
                <Button className="btn btn-primary btn-circle shadow-tight">
                  <FontAwesomeIcon icon={faLock} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

export default Sales;
