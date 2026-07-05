// src/models/IdempotencyKey.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.config';

interface IdempotencyKeyAttributes {
  key: string;
  response: any;
  expiresAt: Date;
  createdAt?: Date;
}

interface IdempotencyKeyCreationAttributes extends Optional<IdempotencyKeyAttributes, 'key'> {}

class IdempotencyKey extends Model<IdempotencyKeyAttributes, IdempotencyKeyCreationAttributes> {
  public key!: string;
  public response!: any;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
}

IdempotencyKey.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    response: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'idempotency_keys',
    timestamps: true,
  }
);

export { IdempotencyKey };