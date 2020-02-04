import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  ManyToMany,
  OneToOne,
  JoinTable,
  createConnection,
  EntityManager,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';

//#region Enums
export enum UnitType {
  kg = 0,
  lb = 1,
  gm = 2,
  ltr = 3
}

export enum PaymentMethod {
  cash = 0,
  debit = 1,
  credit = 2,
  points = 3
}

export enum OrderStatus {
  pending = 0,
  delayed = 1,
  delivered = 2
}
//#endregion

export function getUnitType(type: UnitType) {
  const values = ['kg', 'lg', 'gm', 'ltr']
  return values[type];
}

@Entity('products')
export class Product {
  @PrimaryColumn()
  sku: string;

  @Column('text')
  name: string;

  @Column({ type: 'real', precision: 2 })
  tax: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'real', default: 0 })
  costPrice: number;

  @ManyToMany(type => Category, { nullable: true })
  @JoinTable({ name: 'product-categories' })
  categories?: Promise<Category[]>;

  @Column({ enum: UnitType })
  unitType: UnitType;

  @Column('int')
  minStock: number;

  @Column({ type: 'int', default: 0 })
  qty: number;
}

@Entity('categories')
export class Category {
  @PrimaryColumn({ name: 'text' })
  name: string;

  @Column({ nullable: true })
  description: string;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column('datetime')
  orderDate: Date;

  @Column('datetime')
  requiredDate: Date;

  @Column({ enum: OrderStatus })
  status: OrderStatus;

  @Column('datetime')
  expectedDeliveryDate: Date;

  @Column({ nullable: true })
  refNo?: string;

  @Column({ type: 'datetime', nullable: true })
  deliveryDate?: Date

  @OneToMany(type => OrderItem, orderDetails => orderDetails.order, { cascade: ['insert', 'update'] })
  items: OrderItem[];

  @OneToOne(type => Supplier, { cascade: ['insert', 'update'] })
  @JoinTable()
  supplier: Supplier;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('rowid')
  id?: string;

  @ManyToOne(type => Order, order => order.items)
  order: Order;

  @ManyToMany(type => Product, { cascade: true })
  @JoinColumn()
  product: Product;

  @Column({ type: 'int', default: 1 })
  qty: number;
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'real', precision: 3 })
  paid: number;

  @Column({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;
}

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  email: string;
}

@Entity('discount')
export class Discount {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column('datetime')
  start: Date;

  @Column('datetime')
  end: Date;

  @Column('real', { default: 0 })
  dollarOff: number;

  @Column('real', { default: 0 })
  forQty: number;

  @ManyToMany(type => Product, { cascade: false })
  product: Product;
}

export function connect(dbConnection: string, opts?: { logging?: boolean, name?: string }): Promise<EntityManager> {
  return new Promise(async (resolve, reject) => {
    try {
      let connection = await createConnection({
        type: 'sqlite',
        database: dbConnection,
        synchronize: true,
        logging: opts && opts.logging,
        entities: [
          Product, Category, Transaction, Order, Supplier, OrderItem, Discount
        ],
        name: opts && opts.name
      });
      let manager = connection.createEntityManager();
      resolve(manager)
    } catch (err) {
      reject(err)
    }
  })
}