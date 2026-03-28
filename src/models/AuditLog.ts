import { DataTypes, Model, type Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AuditLogAttributes {
  id: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  userId?: string;
  firebaseUid?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'userId' | 'firebaseUid' | 'email' | 'ipAddress' | 'userAgent' | 'details'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: string;
  public eventType!: string;
  public severity!: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  public userId!: string;
  public firebaseUid!: string;
  public email!: string;
  public ipAddress!: string;
  public userAgent!: string;
  public details!: any;
  
  public readonly createdAt!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'event_type',
    },
    severity: {
      type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL'),
      defaultValue: 'INFO',
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
    },
    firebaseUid: {
      type: DataTypes.STRING(255),
      field: 'firebase_uid',
    },
    email: {
      type: DataTypes.STRING(255),
    },
    ipAddress: {
      type: DataTypes.INET,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent',
    },
    details: {
      type: DataTypes.JSONB,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    underscored: true,
  }
);

export default AuditLog;