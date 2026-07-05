import sequelize from '../config/database.config';
import User from './User';
import SecretCode from './SecretCode';
import AuditLog from './AuditLog';
import Enquiry from './Enquiry';
import Suggestion from './Suggestion';
import Discount from './Discount';
import Order from './Order';

// Define associations
User.hasMany(Enquiry, { as: 'enquiries', foreignKey: 'createdById' });
Enquiry.belongsTo(User, { as: 'creator', foreignKey: 'createdById' });

User.hasMany(Suggestion, { as: 'suggestions', foreignKey: 'createdById' });
Suggestion.belongsTo(User, { as: 'creator', foreignKey: 'createdById' });

User.hasMany(Discount, { as: 'discounts', foreignKey: 'createdBy' });
Discount.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

User.hasMany(Order, { as: 'orders', foreignKey: 'customerId' });
Order.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });

export {
  sequelize,
  User,
  SecretCode,
  AuditLog,
  Enquiry,
  Suggestion,
  Discount,
  Order,
};