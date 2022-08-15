import {
  Product,
  Transaction,
  PaymentMethod
} from '../database/database';
import { EntityManager, Between } from 'typeorm';
//@ts-ignore
import receipt from 'receipt';
import { Dictionary } from 'linqify';
import '../../@types/extensions';
import 'linqify';
import 'datejs';

function formatReceipt(
  items: { product: Product; qty: number }[],
  id: number,
  params?: { currency?: string; width?: number; ruler?: string }
) {
  // get transaction id
  const transactionId = id.toString().padStart(9, '0');

  items = items?.sort((a, b) => b.qty - a.qty);

  let subTotal = items
    ? items?.Sum(item => item.product.costPrice * item.qty)
    : 0;
  let hst_gst = subTotal * 0.15;
  let total = subTotal + hst_gst;

  if (params) receipt.config = { ...receipt.config, ...params };

  let output: string = receipt.create([
    {
      type: 'text',
      value: [
        'TASTE EAST',
        '62 Allandale Rd',
        'taste.east@hotmail.com',
        'www.tasteeastnl.ca'
      ],
      align: 'center'
    },
    { type: 'empty' },
    {
      type: 'properties',
      lines: [
        { name: 'Date', value: new Date().toString('dd/MM/yyyy hh:mm tt') },
        { name: 'Order Number', value: transactionId }
      ]
    },
    {
      type: 'table',
      lines: items?.map(item => ({
        item: item.product.name,
        qty: item.qty,
        cost: item.product.costPrice * 100
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
      type: 'properties',
      lines: [
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
    {
      type: 'text',
      value:
        "Thank you for shopping at Taste East! If you have any requests or complains, don't forget to contact us. Have a great day!",
      align: 'center',
      padding: 5
    },
    { type: 'empty' },
    { type: 'empty' }
  ]);

  return output;
}

/**
 * Print end of the day and return data
 * @param database Database to draw data from
 */
export async function generateEOD(
  database: EntityManager,
  date?: Date
): Promise<string> {
  const productCount = new Dictionary<Product, number>();
  const transactionTime = new Dictionary<string, number>();
  const transactions: Transaction[] = [];
  let debit: number = 0;
  let credit: number = 0;
  let cash: number = 0;

  const getTotal = () => debit + credit + cash;

  const upperLimit = Date.today()
    .addDays(1)
    .toDatabaseString();
  const lowerLimit = Date.today().toDatabaseString();

  // console.log(`Upperlimit: ${upperLimit}, Lowerlimit: ${lowerLimit}`);

  // spin a promise to find transactions
  const dbTask = database.find<Transaction>(Transaction, {
    where: {
      timestamp: Between(lowerLimit, upperLimit)
    }
  });

  dbTask
    .then(_transactions => {
      // calculate printable things
      if (_transactions.length !== 0) {
        transactions.push(..._transactions);

        debit = _transactions
          .Where(t => t.paymentMethod === PaymentMethod.debit)
          .Sum(t => t.price);
        credit = _transactions
          .Where(t => t.paymentMethod === PaymentMethod.credit)
          .Sum(t => t.price);
        cash = _transactions
          .Where(t => t.paymentMethod === PaymentMethod.cash)
          .Sum(t => t.price);

        _transactions.map((t: Transaction) => {
          const time =
            t.timestamp.getHours() > 12
              ? `${t.timestamp.getHours() - 12} pm`
              : `${t.timestamp.getHours()} am`;
          if (transactionTime.ContainsKey(time)) {
            transactionTime.Set(time, transactionTime.Get(time) + 1);
          } else {
            transactionTime.Add(time, 1);
          }
          if (!t.items) {
            console.log('No Product found');
          } else {
            let _items = t.items;
            _items.map(({ product, qty }) => {
              if (product) {
                if (productCount.ContainsKey(product)) {
                  productCount.Set(product, productCount.Get(product) + qty);
                } else {
                  productCount.Add(product, qty);
                }
              }
            });
          }
        });
      }
    })
    .catch(err => console.error(err));

  // wait for db to finish query
  await dbTask;

  function alignStr({
    name,
    value,
    sep
  }: {
    name: string;
    value: string;
    sep?: string;
  }): string {
    return name
      .concat(':')
      .padEnd(receipt.config.width - value.length, sep ?? ' ')
      .concat(value);
  }

  const outputStr = receipt.create([
    {
      type: 'text',
      value: [
        'TASTE EAST',
        '62 Allandale Rd',
        '(+1) 709-579-7366',
        'www.tasteeastnl.ca'
      ],
      align: 'center'
    },
    {
      type: 'properties',
      lines: [{ name: 'Date', value: Date.today().toDateString() }]
    },
    { type: 'empty' },
    { type: 'text', value: 'Daily Sales', align: 'center' },
    {
      type: 'text',
      value: [
        alignStr({ name: 'Credit', value: '$'.concat(credit.toFixed(2)) }),
        alignStr({ name: 'Debit', value: '$'.concat(debit.toFixed(2)) }),
        alignStr({ name: 'Cash', value: '$'.concat(cash.toFixed(2)) })
      ]
    },
    { type: 'text', value: ''.padEnd(receipt.config.width, '-') },
    {
      type: 'text',
      value: alignStr({
        name: 'Total Sales',
        value: '$'.concat(getTotal().toFixed(2))
      })
    },
    { type: 'empty' },
    { type: 'text', value: 'Product Information', align: 'center' },
    {
      type: 'text',
      value: productCount.ToArray().map(({ Key, Value }) => {
        const cost = Key.costPrice * Value;
        return alignStr({ name: Key.name, value: '$'.concat(cost.toFixed(2)) });
      })
    },
    { type: 'empty' },
    { type: 'text', value: ''.padEnd(receipt.config.width, '-') },
    { type: 'text', value: 'Time Table', align: 'center' },
    { type: 'text', value: ''.padEnd(receipt.config.width, '-') },
    {
      type: 'text',
      value: transactionTime
        .ToArray()
        .map(({ Key, Value }) =>
          alignStr({ name: Key, value: Value.toString() })
        )
    }
  ]);

  return outputStr;
}
