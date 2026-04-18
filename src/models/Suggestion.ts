// src/models/Suggestion.ts
import { DataTypes, Model, type Optional } from 'sequelize';
import sequelize from '../config/database.config';

export interface SuggestionAttributes {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'under_review' | 'forwarded';
  // Creator information
  createdById: string;
  createdByName: string;
  createdByEmail: string;
  createdByRole: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  // Forwarding information
  forwardedAt?: Date;
  forwardedBy?: string;
  forwardedNote?: string;
}

export interface SuggestionCreationAttributes extends Optional<SuggestionAttributes, 'id' | 'forwardedAt' | 'forwardedBy' | 'forwardedNote'> {}

class Suggestion extends Model<SuggestionAttributes, SuggestionCreationAttributes> implements SuggestionAttributes {
  declare id: string;
  declare title: string;
  declare content: string;
  declare status: 'pending' | 'under_review' | 'forwarded';
  declare createdById: string;
  declare createdByName: string;
  declare createdByEmail: string;
  declare createdByRole: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  declare forwardedAt?: Date;
  declare forwardedBy?: string;
  declare forwardedNote?: string;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Suggestion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'under_review', 'forwarded'),
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
    forwardedAt: {
      type: DataTypes.DATE,
      field: 'forwarded_at',
      allowNull: true,
    },
    forwardedBy: {
      type: DataTypes.STRING(255),
      field: 'forwarded_by',
      allowNull: true,
    },
    forwardedNote: {
      type: DataTypes.TEXT,
      field: 'forwarded_note',
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Suggestion',
    tableName: 'suggestions',
    timestamps: true,
    underscored: true,
  }
);

export default Suggestion;