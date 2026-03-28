import sequelize from '../config/database';
import User from './User';
import SecretCode from './SecretCode';
import AuditLog from './AuditLog';

// Setup associations
User.hasMany(SecretCode, { 
  as: 'generatedCodes', 
  foreignKey: 'createdBy',
  sourceKey: 'firebaseUid',
  constraints: false
});

User.hasMany(SecretCode, { 
  as: 'usedCodes', 
  foreignKey: 'usedBy' 
});

User.hasMany(AuditLog, { 
  foreignKey: 'userId' 
});

SecretCode.belongsTo(User, { 
  as: 'creator', 
  foreignKey: 'createdBy',
  targetKey: 'firebaseUid',
  constraints: false
});

SecretCode.belongsTo(User, { 
  as: 'user', 
  foreignKey: 'usedBy' 
});

AuditLog.belongsTo(User, { 
  foreignKey: 'userId' 
});

export {
  sequelize,
  User,
  SecretCode,
  AuditLog
};