import sequelize from '../config/database.config';
import User from './User';
import SecretCode from './SecretCode';
import AuditLog from './AuditLog';
import Enquiry from './Enquiry';
import Suggestion from './Suggestion';
import Discount from './Discount';

// Define associations
User.hasMany(Enquiry, { as: 'enquiries', foreignKey: 'createdById' });
Enquiry.belongsTo(User, { as: 'creator', foreignKey: 'createdById' });

User.hasMany(Suggestion, { as: 'suggestions', foreignKey: 'createdById' });
Suggestion.belongsTo(User, { as: 'creator', foreignKey: 'createdById' });

User.hasMany(Discount, { as: 'discounts', foreignKey: 'createdBy' });
Discount.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

export {
  sequelize,
  User,
  SecretCode,
  AuditLog,
  Enquiry,
  Suggestion,
  Discount,
};