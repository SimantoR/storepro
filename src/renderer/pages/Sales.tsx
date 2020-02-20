import React, { Component } from 'react';
import Button from '../components/Button';
import DatePicker from 'react-datepicker';
import { EntityManager, Between } from 'typeorm';
import { Transaction } from '../database/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../@types/extensions';
import 'datejs';
import {
  faLock,
  faRedo,
  faTimes,
  faPrint,
  faArrowCircleLeft,
  faArrowCircleRight
} from '@fortawesome/free-solid-svg-icons';
import Scrollbars from 'react-custom-scrollbars';

interface IProps {
  database: EntityManager;
}

interface IState {
  transactions: Transaction[];
  activeDate: Date;
}

class Sales extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      transactions: [],
      activeDate: new Date()
    };
  }

  componentDidMount() {
    let tasks: Promise<any>[] = [];

    tasks.push(this.loadSales(this.state.activeDate));

    Promise.all<Transaction[]>(tasks)
      .then(([transactions]) => {
        this.setState({ transactions: transactions });
      })
      .catch(err => console.log(err));
  }

  loadSales = (activeDate: Date): Promise<Transaction[]> => {
    return new Promise<Transaction[]>((resolve, reject) => {
      const { database } = this.props;

      const upperLimit = new Date(activeDate).addDays(1);
      const lowerLimit = new Date(activeDate).addDays(-1);

      upperLimit.setHours(0, 0, 0, 0);
      lowerLimit.setHours(0, 0, 0, 0);

      // console.log(`Upper Limit: ${upperLimit.toUTCDate()}`);
      // console.log(`Lower Limit: ${lowerLimit.toUTCDate()}`);

      database
        .find(Transaction, {
          where: {
            timestamp: Between(lowerLimit.toUTCDate(), upperLimit.toUTCDate())
          },
          order: { timestamp: 'ASC' },
          take: 10
        })
        .then(resolve)
        .catch(reject);
    });
  };

  printReceipt = (index: number) => {
    console.log('Printing receipt...');

    const transaction = this.state.transactions[index];
  };

  render() {
    const { transactions, activeDate } = this.state;
    return (
      <div className="w-100 h-100 d-flex flex-column">
        <Scrollbars className="flex-grow-1 w-100">
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
                <th>ID</th>
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
                          .then(() =>
                            this.setState({ transactions: transactions })
                          )
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
        </Scrollbars>
        <div className="w-100 d-flex justify-content-center align-items-center border-top py-1">
          <Button
            className="btn btn-circle btn-lg btn-info shadow-tight"
            onClick={() => {
              const date = new Date(activeDate).addDays(-1);
              const state: IState = { ...this.state, activeDate: date };

              this.loadSales(date)
                .then(transactions => (state.transactions = transactions))
                .catch(err => console.warn(err))
                .finally(() => this.setState(state));
            }}
          >
            <FontAwesomeIcon icon={faArrowCircleLeft} />
          </Button>
          <div className="w-auto mx-2">
            <DatePicker
              dateFormat="dd-MM-yyyy"
              className="form-control"
              maxDate={Date.today()}
              selected={activeDate}
              onChange={date => {
                if (date) {
                  this.loadSales(date)
                    .then(transactions => {
                      this.setState({
                        activeDate: date,
                        transactions: transactions
                      });
                    })
                    .catch((err: Error) => console.warn(err.message));
                }
              }}
            />
            {/* <input
              type="date"
              className="form-control"
              max={Date.today().toUTCDate()}
              value={activeDate.toString('yyyy-MM-dd')}
              onChange={({ currentTarget: { valueAsDate } }) => {
                if (valueAsDate) {
                  this.loadSales(valueAsDate)
                    .then(transactions => {
                      this.setState({
                        activeDate: valueAsDate,
                        transactions: transactions
                      });
                    })
                    .catch((err: Error) => console.warn(err.message));
                }
              }}
            /> */}
          </div>
          <Button
            disabled={activeDate.isToday(Date.today())}
            className={`btn btn-circle btn-lg ${
              activeDate.isToday(Date.today()) ? 'btn-secondary' : 'btn-info'
            } shadow-tight`}
            onClick={() => {
              const date = new Date(activeDate).addDays(1);
              const state: IState = { ...this.state, activeDate: date };

              this.loadSales(date)
                .then(transactions => (state.transactions = transactions))
                .catch(err => console.warn(err))
                .finally(() => this.setState(state));
            }}
          >
            <FontAwesomeIcon icon={faArrowCircleRight} />
          </Button>
        </div>
      </div>
    );
  }
}

export default Sales;
