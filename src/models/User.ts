import { DataTypes, Model, type Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  status: 'pending_email' | 'email_verified' | 'pending_approval' | 'active' | 'rejected' | 'deactivated';
  secretCode?: string;
  lastLogin?: Date;
  createdBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'secretCode' | 'lastLogin' | 'createdBy' | 'approvedAt' | 'approvedBy'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public firebaseUid!: string;
  public email!: string;
  public name!: string;
  public role!: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  public status!: 'pending_email' | 'email_verified' | 'pending_approval' | 'active' | 'rejected' | 'deactivated';
  public secretCode!: string;
  public lastLogin!: Date;
  public createdBy!: string;
  public approvedAt!: Date;
  public approvedBy!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firebaseUid: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'firebase_uid',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'EMPLOYEE', 'CLIENT'),
      defaultValue: 'CLIENT',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending_email', 'email_verified', 'pending_approval', 'active', 'rejected', 'deactivated'),
      defaultValue: 'pending_email',
      allowNull: false,
    },
    secretCode: {
      type: DataTypes.STRING(255),
      field: 'secret_code',
    },
    lastLogin: {
      type: DataTypes.DATE,
      field: 'last_login',
    },
    createdBy: {
      type: DataTypes.STRING(255),
      field: 'created_by',
    },
    approvedAt: {
      type: DataTypes.DATE,
      field: 'approved_at',
    },
    approvedBy: {
      type: DataTypes.STRING(255),
      field: 'approved_by',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true, // Use snake_case in database
  }
);

export default User;

/*
import { DataTypes, Model, type Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'employee' | 'customer';
  phone?: string;
  address?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  emailVerified: boolean;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'emailVerified'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: 'admin' | 'employee' | 'customer';
  public phone!: string;
  public address!: string;
  public avatar!: string;
  public isActive!: boolean;
  public lastLogin!: Date;
  public emailVerified!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
  
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'employee', 'customer'),
      defaultValue: 'customer',
    },
    phone: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.TEXT,
    },
    avatar: {
      type: DataTypes.STRING,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

export default User;
*/