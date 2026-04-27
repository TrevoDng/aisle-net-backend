// src/models/Discount.ts
import { DataTypes, Model, type Optional } from 'sequelize';
import sequelize from '../config/database.config';

export interface DiscountAttributes {
  id: string;
  productId: string;
  discountAmount: number; // Percentage (1-100)
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  startDate: Date;
  endDate: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DiscountCreationAttributes extends Optional<DiscountAttributes, 'id'> {}

class Discount extends Model<DiscountAttributes, DiscountCreationAttributes> implements DiscountAttributes {
  declare id: string;
  declare productId: string;
  declare discountAmount: number;
  declare createdBy: string;
  declare createdByName: string;
  declare createdByEmail: string;
  declare status: 'pending' | 'approved' | 'rejected' | 'expired';
  declare startDate: Date;
  declare endDate: Date;
  declare approvedBy?: string;
  declare approvedAt?: Date;
  declare rejectionReason?: string;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Discount.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
    discountAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 100,
      },
      field: 'discount_amount',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
    },
    createdByName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'created_by_name',
    },
    createdByEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'created_by_email',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
      defaultValue: 'pending',
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date',
    },
    approvedBy: {
      type: DataTypes.UUID,
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
    modelName: 'Discount',
    tableName: 'discounts',
    timestamps: true,
    underscored: true,
  }
);

export default Discount;