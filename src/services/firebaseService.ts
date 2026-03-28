import logger from '../utils/logger';

interface FirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

export class FirebaseService {
  private apiKey: string;
  private verifyTokenUrl: string;

  constructor() {
    this.apiKey = process.env.FIREBASE_WEB_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('FIREBASE_WEB_API_KEY is not set');
    }
    this.verifyTokenUrl = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${this.apiKey}`;
  }

  async verifyIdToken(idToken: string): Promise<FirebaseUser> {
    try {
      const response = await fetch(this.verifyTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Firebase token verification failed', { error });
        throw new Error('Invalid token');
      }

      const data: any = await response.json();
      
      if (!data.users || data.users.length === 0) {
        throw new Error('No user found for token');
      }

      const user = data.users[0];
      
      return {
        uid: user.localId,
        email: user.email,
        emailVerified: user.emailVerified,
      };
    } catch (error) {
      logger.error('Error verifying Firebase token', { error });
      throw error;
    }
  }
}