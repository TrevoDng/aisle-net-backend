import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.config';

interface OrderAttributes {
  id: string;
  orderNumber: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: any;
  paymentMethod?: string;
  paymentId?: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: string;
  public orderNumber!: string;
  public amount!: number;
  public currency!: string;
  public status!: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  public customerEmail!: string;
  public customerName?: string;
  public customerPhone?: string;
  public shippingAddress?: any;
  public paymentMethod?: string;
  public paymentId?: string;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'ZAR',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'),
      defaultValue: 'PENDING',
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
    },
    customerPhone: {
      type: DataTypes.STRING,
    },
    shippingAddress: {
      type: DataTypes.JSON,
    },
    paymentMethod: {
      type: DataTypes.STRING,
    },
    paymentId: {
      type: DataTypes.STRING,
    },
    metadata: {
      type: DataTypes.JSON,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
  }
);

export default Order;