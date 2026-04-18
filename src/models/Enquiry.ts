// src/models/Enquiry.ts
import { DataTypes, Model, type Optional } from 'sequelize';
import sequelize from '../config/database.config';

export interface EnquiryAttributes {
  id: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  // Creator information
  createdById: string;
  createdByName: string;
  createdByEmail: string;
  createdByRole: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  // Resolution information
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface EnquiryCreationAttributes extends Optional<EnquiryAttributes, 'id' | 'resolvedAt' | 'resolvedBy' | 'resolutionNote'> {}

class Enquiry extends Model<EnquiryAttributes, EnquiryCreationAttributes> implements EnquiryAttributes {
  declare id: string;
  declare subject: string;
  declare message: string;
  declare status: 'pending' | 'in_progress' | 'resolved';
  declare createdById: string;
  declare createdByName: string;
  declare createdByEmail: string;
  declare createdByRole: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  declare resolvedAt?: Date;
  declare resolvedBy?: string;
  declare resolutionNote?: string;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Enquiry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'resolved'),
      defaultValue: 'pending',
      allowNull: false,
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by_id',
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
    createdByRole: {
      type: DataTypes.ENUM('ADMIN', 'EMPLOYEE', 'CLIENT'),
      allowNull: false,
      field: 'created_by_role',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      field: 'resolved_at',
      allowNull: true,
    },
    resolvedBy: {
      type: DataTypes.STRING(255),
      field: 'resolved_by',
      allowNull: true,
    },
    resolutionNote: {
      type: DataTypes.TEXT,
      field: 'resolution_note',
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Enquiry',
    tableName: 'enquiries',
    timestamps: true,
    underscored: true,
  }
);

export default Enquiry;