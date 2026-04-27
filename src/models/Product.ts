// src/models/Product.ts
import { DataTypes, Model, type Optional } from 'sequelize';
import sequelize from '../config/database.config';

export interface ProductAttributes {
  id: string;
  category: string[]; // Array of category path strings
  brand: string;
  title: string;
  description: string;
  longDescription: string;
  price: number;
  stockQuantity: number;
  imgSrc: string[]; // Array of image URLs
  status: 'pending' | 'approved' | 'rejected' | 'deactivated';
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: string;
  declare category: string[];
  declare brand: string;
  declare title: string;
  declare description: string;
  declare longDescription: string;
  declare price: number;
  declare stockQuantity: number;
  declare imgSrc: string[];
  declare status: 'pending' | 'approved' | 'rejected' | 'deactivated';
  declare employeeId: string;
  declare employeeName: string;
  declare employeeEmail: string;
  declare approvedBy?: string;
  declare approvedAt?: Date;
  declare rejectionReason?: string;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Store array as JSON
      allowNull: false,
      defaultValue: [],
      field: 'category',
      // PostgreSQL can also use DataTypes.ARRAY(DataTypes.STRING)
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    longDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'long_description',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'stock_quantity',
    },
    imgSrc: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'img_src',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'deactivated'),
      defaultValue: 'pending',
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'employee_id',
    },
    employeeName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'employee_name',
    },
    employeeEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'employee_email',
    },
    approvedBy: {
      type: DataTypes.STRING(255),
      field: 'approved_by',
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      field: 'approved_at',
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      field: 'rejection_reason',
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    underscored: true,
  }
);

export default Product;