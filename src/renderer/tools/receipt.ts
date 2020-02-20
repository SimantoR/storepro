import { Product, Transaction } from '../database/database';
import { EntityManager, Between } from 'typeorm';
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
export function printEndOfDay(database?: EntityManager): string {
  if (database) {
    const upperLimit = Date.today().toStandardFormat();
    const lowerLimit = Date.today().addDays(1).toStandardFormat();

    console.log(`Upperlimit: ${upperLimit}, Lowerlimit: ${lowerLimit}`);

    database
      .find<Transaction>(Transaction, {
        where: {
          timestamp: Between(upperLimit, lowerLimit)
        }
      })
      .then(transactions => {
        if (transactions.length === 0) {
          console.log('No transactions found');
        }
        else {
          console.log(transactions);
          const productCount = new Dictionary<Product, number>();
          transactions.map(async (t: Transaction) => {
            if (!t.items) {
              console.log('No Product found');
            } else {
              let _items = await t.items
              _items.map(({ product, qty }) => {
                if (productCount.ContainsKey(product)) {
                  productCount.Set(product, productCount.Get(product) + qty);
                } else {
                  productCount.Add(product, qty);
                }
              });
            }
          });
          console.log(
            `Total Products: ${productCount.Keys.Count()}, Total Items: ${productCount.Sum(
              x => x.Value
            )}`
          );
        }
      })
      .catch(err => console.error(err));
  }

  const dataset = [
    { name: 'Gadorade', value: 32.4 },
    { name: 'Powarade', value: 32.4 },
    { name: 'Coke 2L', value: 32.4 },
    { name: 'Humpty Dumpty', value: 32.4 }
  ];

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
        'taste.east@hotmail.com',
        'www.tasteeastnl.ca'
      ],
      align: 'center'
    },
    { type: 'empty' },
    { type: 'text', value: 'Daily Sales', align: 'center' },
    {
      type: 'text',
      value: [
        alignStr({ name: 'Credit', value: '$ 924.44' }),
        alignStr({ name: 'Debit', value: '$ 924.44' }),
        alignStr({ name: 'Cash', value: '$ 924.44' })
      ]
    },
    { type: 'text', value: ''.padEnd(receipt.config.width, '-') },
    {
      type: 'text',
      value: alignStr({ name: 'Total Sales', value: '$ 924.44' })
    },
    { type: 'empty' },
    { type: 'text', value: 'Product Information', align: 'center' },
    {
      type: 'text',
      value: dataset.map(data => {
        return alignStr({
          name: data.name,
          value: '$ '.concat(data.value.toFixed(2))
        });
        // let value = data.value.toFixed(2);
        // return data.name.concat(':').padEnd(receipt.config.width - value.length - 1, '-').concat('$', value);
      })
    },
    { type: 'empty' },
    { type: 'text', value: ''.padEnd(receipt.config.width, '-') },
    { type: 'text', value: 'Time Table', align: 'center' },
    { type: 'text', value: ''.padEnd(receipt.config.width, '-') },
    {
      type: 'text',
      value: [
        alignStr({ name: '10am', value: '2' }),
        alignStr({ name: '11am', value: '2' }),
        alignStr({ name: '12pm', value: '2' }),
        alignStr({ name: '1pm', value: '2' }),
        alignStr({ name: '2pm', value: '2' }),
        alignStr({ name: '3pm', value: '2' }),
        alignStr({ name: '4pm', value: '2' }),
        alignStr({ name: '5pm', value: '2' }),
        alignStr({ name: '6pm', value: '2' }),
        alignStr({ name: '7pm', value: '2' }),
        alignStr({ name: '8pm', value: '2' })
      ]
    }
  ]);

  return outputStr;
}
