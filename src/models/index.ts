import sequelize from '../config/database.config';
import User from './User';
import SecretCode from './SecretCode';
import AuditLog from './AuditLog';
import Enquiry from './Enquiry';
import Suggestion from './Suggestion';

// Define associations
User.hasMany(Enquiry, { as: 'enquiries', foreignKey: 'createdById' });
Enquiry.belongsTo(User, { as: 'creator', foreignKey: 'createdById' });

User.hasMany(Suggestion, { as: 'suggestions', foreignKey: 'createdById' });
Suggestion.belongsTo(User, { as: 'creator', foreignKey: 'createdById' });

export {
  sequelize,
  User,
  SecretCode,
  AuditLog,
  Enquiry,
  Suggestion
};