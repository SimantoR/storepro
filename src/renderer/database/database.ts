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
  const values = ['kg', 'lg', 'gm', 'ltr'];
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

  @Column({ enum: UnitType })
  unitType: UnitType;

  @Column('int')
  minStock: number;

  @Column({ type: 'int', default: 0 })
  qty: number;
}

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'real', precision: 3, nullable: false })
  price: number;

  @Column({ type: 'real', precision: 3, nullable: false })
  paid: number;

  @Column({ type: 'real', precision: 3, nullable: false, default: 0.0 })
  tax: number;

  @Column({ type: 'datetime' })
  timestamp: Date;

  @OneToMany(
    type => PurchaseItem,
    item => item.purchase,
    { onDelete: 'CASCADE', cascade: ['insert'], eager: true }
  )
  items: PurchaseItem[];

  @Column({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;
}

@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(
    type => Purchase,
    transaction => transaction.items,
    { onDelete: 'CASCADE' }
  )
  purchase: Purchase;

  @ManyToOne(type => Product, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    eager: true
  })
  product: Product;

  @Column('int')
  qty: number;
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

  @ManyToOne(type => Product, { cascade: true })
  product: Product;
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
  deliveryDate?: Date;

  @OneToMany(
    type => OrderItem,
    orderDetails => orderDetails.order,
    { cascade: ['insert', 'update'] }
  )
  items: OrderItem[];

  @OneToOne(type => Supplier, { cascade: ['insert', 'update'] })
  @JoinTable()
  supplier: Supplier;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('rowid')
  id?: string;

  @ManyToOne(
    type => Order,
    order => order.items
  )
  order: Order;

  @ManyToMany(type => Product, { cascade: true })
  @JoinColumn()
  product: Product;

  @Column({ type: 'int', default: 1 })
  qty: number;
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

@Entity('event_logs')
export class EventLog {
  @PrimaryGeneratedColumn('rowid')
  id: string;

  @Column('datetime')
  timestamp: Date;

  @ManyToMany(type => Product, { cascade: true })
  products: Product[];
}

export function connect(
  dbConnection: string,
  opts?: { logging?: boolean; name?: string }
): Promise<EntityManager> {
  return new Promise(async (resolve, reject) => {
    try {
      let connection = await createConnection({
        type: 'sqlite',
        database: dbConnection,
        synchronize: true,
        logging: opts && opts.logging,
        entities: [Product, Purchase, PurchaseItem],
        name: opts && opts.name
      });
      let manager = connection.createEntityManager();
      resolve(manager);
    } catch (err) {
      reject(err);
    }
  });
}
