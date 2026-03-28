import { DataTypes, Model, type Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SecretCodeAttributes {
  id: string;
  code: string;
  isUsed: boolean;
  expiresAt: Date;
  createdBy: string;
  usedBy?: string;
  usedAt?: Date;
}

export interface SecretCodeCreationAttributes extends Optional<SecretCodeAttributes, 'id' | 'isUsed' | 'usedBy' | 'usedAt'> {}

class SecretCode extends Model<SecretCodeAttributes, SecretCodeCreationAttributes> implements SecretCodeAttributes {
  public id!: string;
  public code!: string;
  public isUsed!: boolean;
  public expiresAt!: Date;
  public createdBy!: string;
  public usedBy!: string;
  public usedAt!: Date;
  
  public readonly createdAt!: Date;
}

SecretCode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_used',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    createdBy: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'created_by',
    },
    usedBy: {
      type: DataTypes.UUID,
      field: 'used_by',
    },
    usedAt: {
      type: DataTypes.DATE,
      field: 'used_at',
    },
  },
  {
    sequelize,
    modelName: 'SecretCode',
    tableName: 'secret_codes',
    timestamps: true,
    underscored: true,
  }
);

export default SecretCode;