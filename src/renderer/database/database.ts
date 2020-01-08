import {
    PrimaryGeneratedColumn,
    Column,
    Entity,
    Connection,
    createConnection,
    JoinTable,
    ManyToMany,
    EntityManager,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn
} from "typeorm"

//#region Entities
@Entity()
export class Product {
    @PrimaryColumn('text')
    sku: string;

    @Column('text')
    name: string;

    @Column({ name: 'cost_price', type: 'real' })
    costPrice: number;

    @Column({ name: 'sell_price', type: 'real' })
    sellPrice: number;

    @Column('datetime', { name: 'creation_date' })
    creationDate: Date;

    @Column('datetime', { name: 'mod_date' })
    modificationDate: Date

    @ManyToMany(type => Category, { cascade: true })
    @JoinTable({ name: 'product-categories' })
    categories: Promise<Category[]>;

    static create = (props: Product) => {
        let product = new Product()
        product.sku = props.sku
        product.name = props.name
        product.costPrice = props.costPrice
        product.sellPrice = props.sellPrice
        product.creationDate = props.modificationDate
        product.modificationDate = props.modificationDate
        product.categories = props.categories

        return product
    }
}

@Entity()
export class Category {
    @PrimaryGeneratedColumn('rowid')
    id: string;

    @Column("text")
    name: string;

    @Column('datetime', { name: 'creation_date' })
    creationDate: Date;

    static create = (props: { name: string, creationDate: Date }) => {
        let category = new Category()
        category.name = props.name
        category.creationDate = props.creationDate
        return category
    }
}

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn('rowid')
    id: String;

    @ManyToMany(type => Product, product => product.categories)
    @JoinTable({ name: 'transaction-products' })
    products: Product[];

    @Column('datetime')
    timestamp: Date;

    @Column('datetime')
    lastModified: Date;

    @Column('real')
    totalPaid: number;
}
//#endregion

var _connection: Connection;

export function connect(dbConnection: string, opts?: { logging?: boolean, name?: string }): Promise<EntityManager> {
    return new Promise(async (resolve, reject) => {
        try {
            _connection = await createConnection({
                type: 'sqlite',
                database: dbConnection,
                synchronize: true,
                logging: opts && opts.logging,
                entities: [
                    Product, Category
                ],
                name: opts && opts.name
            })
            let manager = _connection.createEntityManager();
            resolve(manager)
        } catch (err) {
            reject(err)
        }
    })
}

export function connectSync(dbConnection: string) {
    createConnection({
        type: 'sqlite',
        database: dbConnection,
        synchronize: true,
        logging: false,
        entities: [
            Product, Category, Transaction
        ]
    }).then(connection => {
        _connection = connection
    }).catch(err => console.error(err))
    while (_connection !== undefined) {
        if (_connection)
            break;
    }
    return _connection
}

export function getConnection(): Connection {
    return _connection;
}

export function closeConnection() {
    _connection.close();
}