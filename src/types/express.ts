import { User as UserModel } from '../models';

declare global {
  namespace Express {
    interface Request {
      user: {
        uid: string;
        email: string;
        emailVerified: boolean;
        dbUser: UserModel;
      };
    }
  }
}