import React, { Component } from 'react';
import Button from '../components/Button';
import DatePicker from 'react-datepicker';
import { EntityManager, Between } from 'typeorm';
import { Purchase } from '../database/database';
import { printer as ThermalPrinter } from 'node-thermal-printer';
import { generateEOD } from '../tools/receipt';
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
  printer: ThermalPrinter;
}

interface IState {
  transactions: Purchase[];
  activeDate: Date;
}

class Sales extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      transactions: [],
      activeDate: Date.today()
    };
  }

  componentDidMount() {
    let tasks: Promise<any>[] = [];

    tasks.push(this.loadSales(this.state.activeDate));

    Promise.all<Purchase[]>(tasks)
      .then(([transactions]) => {
        this.setState({ transactions: transactions });
      })
      .catch(err => console.log(err));
  }

  /**
   * Load transactions for given date
   * @param activeDate The date parameter to search for
   */
  loadSales = (activeDate: Date): Promise<Purchase[]> => {
    return new Promise<Purchase[]>((resolve, reject) => {
      const { database } = this.props;

      const upperLimit = new Date(activeDate).addDays(1);
      const lowerLimit = new Date(activeDate);

      upperLimit.setHours(0, 0, 0, 0);
      lowerLimit.setHours(0, 0, 0, 0);

      database
        .find(Purchase, {
          where: {
            timestamp: Between(
              lowerLimit.toDatabaseString(),
              upperLimit.toDatabaseString()
            )
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

  printEOD = () => {
    const { database, printer } = this.props;
    const { activeDate } = this.state;

    generateEOD(database, activeDate)
      .then(EOD => {
        printer.clear();
        printer.print(EOD);
        printer.cut();
        printer.execute();
        printer.clear();
      })
      .catch((err: Error) => console.error(err.message));
  };

  render() {
    const { transactions, activeDate } = this.state;
    const { database } = this.props;
    return (
      <div className="w-100 h-100 d-flex flex-column">
        <Scrollbars className="flex-grow-1 w-100">
          <table className="table table-striped table-borderless text-center align-content-center">
            <colgroup>
              <col width="5%" />
              <col width="25%" />
              <col width="10%" />
              <col width="10%" />
              <col width="10%" />
              <col width="15%" />
              <col width="25%" />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>Price</th>
                <th>Paid Amount</th>
                <th>HST/GST</th>
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
                  <td>&#36; {t.tax.toFixed(2)}</td>
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
                      className="btn btn-red btn-circle shadow-tight"
                      onClick={() => {
                        const item = transactions[i];
                        database.remove(item)
                          .then(() => {
                            transactions.splice(i, 1);
                            this.setState({
                              transactions: Array.from(transactions)
                            });
                          }).catch(console.error);
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
        <div className="w-100 d-flex justify-content-center align-items-center border-top p-1">
          <Button
            className="mr-auto btn btn-lg btn-circle btn-red"
            onClick={this.printEOD}
          >
            <FontAwesomeIcon icon={faPrint} />
          </Button>
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
