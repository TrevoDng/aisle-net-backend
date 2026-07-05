// src/services/ozow.service.ts
import crypto from 'crypto';
import axios from 'axios';

export interface OzowPaymentRequest {
  SiteCode: string;
  Amount: number;
  TransactionReference: string;
  BankReference: string;
  CurrencyCode: 'ZAR';
  CountryCode: 'ZA';
  CancelUrl: string;
  ErrorUrl: string;
  SuccessUrl: string;
  NotifyUrl: string;
  IsTest: boolean;
  Customer: string;
  Hash: string;
}

export interface OzowNotification {
  TransactionReference: string;
  TransactionId: string;
  Amount: number;
  CurrencyCode: string;
  TransactionStatus: 'Complete' | 'Cancelled' | 'Error' | 'Pending';
  Customer: string;
  SiteCode: string;
  Hash: string;
  Optional1?: string;
  Optional2?: string;
  Optional3?: string;
  Optional4?: string;
  Optional5?: string;
}

export class OzowService {
  private siteCode: string;
  private privateKey: string;
  private apiKey: string;
  private isSandbox: boolean;

  constructor() {
    this.siteCode = process.env.OZOW_SITE_CODE!;
    this.privateKey = process.env.OZOW_PRIVATE_KEY!;
    this.apiKey = process.env.OZOW_API_KEY!;
    this.isSandbox = process.env.NODE_ENV !== 'production';
  }

  generateHash(params: Record<string, any>): string {
    // Ozow requires a specific order for the hash
    // Order: SiteCode, Amount, TransactionReference, BankReference, 
    //        CurrencyCode, CountryCode, CancelUrl, ErrorUrl, 
    //        SuccessUrl, NotifyUrl, IsTest, Customer, PrivateKey
    const hashString = 
      `${this.siteCode}${params.Amount}${params.TransactionReference}${params.BankReference}${params.CurrencyCode}${params.CountryCode}${params.CancelUrl}${params.ErrorUrl}${params.SuccessUrl}${params.NotifyUrl}${params.IsTest}${params.Customer}${this.privateKey}`;
    
    return crypto.createHash('sha512').update(hashString).digest('hex');
  }

  verifyNotificationHash(notification: OzowNotification): boolean {
    // Order: TransactionReference, Amount, CurrencyCode, TransactionStatus, 
    //        SiteCode, TransactionId, Customer, PrivateKey
    const hashString = 
      `${notification.TransactionReference}${notification.Amount}${notification.CurrencyCode}${notification.TransactionStatus}${this.siteCode}${notification.TransactionId}${notification.Customer}${this.privateKey}`;
    
    const computedHash = crypto.createHash('sha512').update(hashString).digest('hex');
    return computedHash === notification.Hash;
  }

  generatePaymentRequest(data: {
    amount: number;
    transactionReference: string;
    bankReference: string;
    customer: string;
  }): OzowPaymentRequest {
    const baseParams = {
      SiteCode: this.siteCode,
      Amount: data.amount,
      TransactionReference: data.transactionReference,
      BankReference: data.bankReference,
      CurrencyCode: 'ZAR' as const,
      CountryCode: 'ZA' as const,
      CancelUrl: process.env.CANCEL_URL!,
      ErrorUrl: `${process.env.APP_URL}/payment/error`,
      SuccessUrl: process.env.SUCCESS_URL!,
      NotifyUrl: process.env.OZOW_NOTIFY_URL!,
      IsTest: this.isSandbox,
      Customer: data.customer,
    };

    const hash = this.generateHash(baseParams);

    return {
      ...baseParams,
      Hash: hash,
    };
  }

  async queryTransaction(transactionId: string) {
    try {
      const timestamp = new Date().toISOString();
      const hashString = `${this.siteCode}${timestamp}${this.apiKey}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      const response = await axios.get(
        `https://api.ozow.com/GetTransactionRequest`,
        {
          params: {
            siteCode: this.siteCode,
            transactionId,
          },
          headers: {
            'ApiKey': this.apiKey,
            'Hash': hash,
            'Timestamp': timestamp,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Ozow query error:', error);
      throw error;
    }
  }

  async getTransactionStatus(transactionReference: string): Promise<string> {
    // You would typically use the queryTransaction above
    // This is a placeholder
    return 'pending';
  }
}

// 
// import crypto from 'crypto';
// import axios from 'axios';

// export interface OzowPaymentRequest {
//   SiteCode: string;
//   Amount: number;
//   TransactionReference: string;
//   BankReference: string;
//   CurrencyCode: 'ZAR';
//   CountryCode: 'ZA';
//   CancelUrl: string;
//   ErrorUrl: string;
//   SuccessUrl: string;
//   NotifyUrl: string;
//   IsTest: boolean;
//   Customer: string;
//   Hash: string;
// }

// export interface OzowNotification {
//   TransactionReference: string;
//   TransactionId: string;
//   Amount: number;
//   CurrencyCode: string;
//   TransactionStatus: 'Complete' | 'Cancelled' | 'Error' | 'Pending';
//   Customer: string;
//   SiteCode: string;
//   Hash: string;
//   Optional1?: string;
//   Optional2?: string;
//   Optional3?: string;
//   Optional4?: string;
//   Optional5?: string;
// }

// export class OzowService {
//   private siteCode: string;
//   private privateKey: string;
//   private apiKey: string;
//   private isSandbox: boolean;

//   constructor() {
//     this.siteCode = process.env.OZOW_SITE_CODE!;
//     this.privateKey = process.env.OZOW_PRIVATE_KEY!;
//     this.apiKey = process.env.OZOW_API_KEY!;
//     this.isSandbox = process.env.NODE_ENV !== 'production';
//   }

//   generateHash(params: Record<string, any>): string {
//     // Ozow requires a specific order: TransactionReference, Amount, CurrencyCode, TransactionStatus, SiteCode, TransactionId, Customer, PrivateKey
//     // But for initial request, we use: SiteCode, Amount, TransactionReference, BankReference, CurrencyCode, CountryCode, CancelUrl, ErrorUrl, SuccessUrl, NotifyUrl, IsTest, Customer, PrivateKey
//     const hashString = `${this.siteCode}${params.Amount}${params.TransactionReference}${params.BankReference}${params.CurrencyCode}${params.CountryCode}${params.CancelUrl}${params.ErrorUrl}${params.SuccessUrl}${params.NotifyUrl}${params.IsTest}${params.Customer}${this.privateKey}`;
//     return crypto.createHash('sha512').update(hashString).digest('hex');
//   }

//   verifyNotificationHash(notification: OzowNotification): boolean {
//     // Order: TransactionReference, Amount, CurrencyCode, TransactionStatus, SiteCode, TransactionId, Customer, PrivateKey
//     const hashString = `${notification.TransactionReference}${notification.Amount}${notification.CurrencyCode}${notification.TransactionStatus}${this.siteCode}${notification.TransactionId}${notification.Customer}${this.privateKey}`;
//     const computedHash = crypto.createHash('sha512').update(hashString).digest('hex');
//     return computedHash === notification.Hash;
//   }

//   generatePaymentRequest(data: {
//     amount: number;
//     transactionReference: string;
//     bankReference: string;
//     customer: string;
//   }): OzowPaymentRequest {
//     const baseParams = {
//       SiteCode: this.siteCode,
//       Amount: data.amount,
//       TransactionReference: data.transactionReference,
//       BankReference: data.bankReference,
//       CurrencyCode: 'ZAR' as const,
//       CountryCode: 'ZA' as const,
//       CancelUrl: process.env.CANCEL_URL!,
//       ErrorUrl: `${process.env.APP_URL}/payment/error`,
//       SuccessUrl: process.env.SUCCESS_URL!,
//       NotifyUrl: process.env.OZOW_NOTIFY_URL!,
//       IsTest: this.isSandbox,
//       Customer: data.customer,
//     };

//     const hash = this.generateHash(baseParams);

//     return {
//       ...baseParams,
//       Hash: hash,
//     };
//   }

//   async queryTransaction(transactionId: string) {
//     try {
//       const timestamp = new Date().toISOString();
//       const hashString = `${this.siteCode}${timestamp}${this.apiKey}`;
//       const hash = crypto.createHash('sha512').update(hashString).digest('hex');

//       const response = await axios.get(
//         `https://api.ozow.com/GetTransactionRequest`,
//         {
//           params: {
//             siteCode: this.siteCode,
//             transactionId,
//           },
//           headers: {
//             'ApiKey': this.apiKey,
//             'Hash': hash,
//             'Timestamp': timestamp,
//           },
//         }
//       );

//       return response.data;
//     } catch (error) {
//       console.error('Ozow query error:', error);
//       throw error;
//     }
//   }
// }
