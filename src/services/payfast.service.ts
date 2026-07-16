// src/services/payfast.service.ts
import crypto from 'crypto';
import axios from 'axios';

export interface PayfastPaymentData {
  amount: number;
  item_name: string;
  item_description?: string;
  email_address: string;
  name_first?: string;
  name_last?: string;
  m_payment_id: string; // Your order ID
  custom_int1?: number;
  custom_str1?: string;
}

export interface PayfastITNData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  amount_gross: number;
  amount_fee: number;
  amount_net: number;
  name_first: string;
  name_last: string;
  email_address: string;
  signature: string;
  // ... other fields
}

export class PayfastService {
  private merchantId: string;
  private merchantKey: string;
  private passphrase: string;
  private isSandbox: boolean;

  constructor() {
    this.merchantId = process.env.PAYFAST_MERCHANT_ID!;
    this.merchantKey = process.env.PAYFAST_MERCHANT_KEY!;
    this.passphrase = process.env.PAYFAST_PASSPHRASE!;
    this.isSandbox = process.env.NODE_ENV !== 'production';
  }

  private getBaseUrl(): string {
    return this.isSandbox
      ? 'https://sandbox.payfast.co.za'
      : 'https://www.payfast.co.za';
  }

  generatePaymentForm(
    data: PayfastPaymentData,
    frontendUrl: string,
    backendUrl: string): {
    url: string;
    fields: Record<string, string>;
  } {
    const fields: Record<string, string> = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      amount: data.amount.toFixed(2),
      item_name: data.item_name,
      email_address: data.email_address,
      m_payment_id: data.m_payment_id,
      return_url: `${frontendUrl}/payment/success`,
      cancel_url: `${frontendUrl}/payment/cancel`,
      notify_url: `${backendUrl}/api/webhooks/payfast`,
    };

    if (data.item_description) fields.item_description = data.item_description;
    if (data.name_first) fields.name_first = data.name_first;
    if (data.name_last) fields.name_last = data.name_last;

    // Generate signature
    fields.signature = this.generateSignature(fields);

    return {
      url: `${this.getBaseUrl()}/eng/process`,
      fields,
    };
  }

  generateSignature(data: Record<string, string>): string {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(data).sort();
    let paramString = '';

    for (const key of sortedKeys) {
      if (key !== 'signature' && data[key] !== '') {
        paramString += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
      }
    }

    // Remove trailing &
    paramString = paramString.slice(0, -1);

    // Add passphrase if exists
    if (this.passphrase) {
      paramString += `&passphrase=${encodeURIComponent(this.passphrase).replace(/%20/g, '+')}`;
    }

    return crypto.createHash('md5').update(paramString).digest('hex');
  }

  async verifyITN(data: PayfastITNData, clientIp: string): Promise<boolean> {
    // 1. Verify source IP
    const allowedIps = [
      '104.18.0.0', '104.18.1.0', '172.64.0.0', // PayFast IP ranges
    ];
    if (!allowedIps.includes(clientIp)) {
      throw new Error('Invalid IP source');
    }

    // 2. Verify signature
    const { signature, ...payload } = data;
    const expectedSignature = this.generateSignature(payload as any);
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // 3. Verify payment status
    if (data.payment_status !== 'COMPLETE') {
      return false;
    }

    return true;
  }

  async queryPayment(paymentId: string): Promise<any> {
    // PayFast doesn't have a public query API
    // You would need to check your database for the ITN
    return null;
  }
}

// // src/services/payfast.service.ts
// import crypto from 'crypto';
// import axios from 'axios';

// export interface PayfastPaymentData {
//   amount: number;
//   item_name: string;
//   item_description?: string;
//   email_address: string;
//   name_first?: string;
//   name_last?: string;
//   m_payment_id: string; // Your order ID
//   custom_int1?: number;
//   custom_str1?: string;
// }

// export interface PayfastITNData {
//   m_payment_id: string;
//   pf_payment_id: string;
//   payment_status: string;
//   amount_gross: number;
//   amount_fee: number;
//   amount_net: number;
//   name_first: string;
//   name_last: string;
//   email_address: string;
//   signature: string;
//   // ... other fields
// }

// export class PayfastService {
//   private merchantId: string;
//   private merchantKey: string;
//   private passphrase: string;
//   private isSandbox: boolean;

//   constructor() {
//     this.merchantId = process.env.PAYFAST_MERCHANT_ID!;
//     this.merchantKey = process.env.PAYFAST_MERCHANT_KEY!;
//     this.passphrase = process.env.PAYFAST_PASSPHRASE!;
//     this.isSandbox = process.env.NODE_ENV !== 'production';
//   }

//   private getBaseUrl(): string {
//     return this.isSandbox
//       ? 'https://sandbox.payfast.co.za'
//       : 'https://www.payfast.co.za';
//   }

//   generatePaymentForm(data: PayfastPaymentData): {
//     url: string;
//     fields: Record<string, string>;
//   } {
//     const fields: Record<string, string> = {
//       merchant_id: this.merchantId,
//       merchant_key: this.merchantKey,
//       amount: data.amount.toFixed(2),
//       item_name: data.item_name,
//       email_address: data.email_address,
//       m_payment_id: data.m_payment_id,
//       return_url: process.env.SUCCESS_URL!,
//       cancel_url: process.env.CANCEL_URL!,
//       notify_url: `${process.env.APP_URL}/api/webhooks/payfast`,
//     };

//     if (data.item_description) fields.item_description = data.item_description;
//     if (data.name_first) fields.name_first = data.name_first;
//     if (data.name_last) fields.name_last = data.name_last;

//     // Generate signature
//     fields.signature = this.generateSignature(fields);

//     return {
//       url: `${this.getBaseUrl()}/eng/process`,
//       fields,
//     };
//   }

//   generateSignature(data: Record<string, string>): string {
//     // Sort parameters alphabetically
//     const sortedKeys = Object.keys(data).sort();
//     let paramString = '';

//     for (const key of sortedKeys) {
//       if (key !== 'signature' && data[key] !== '') {
//         paramString += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
//       }
//     }

//     // Remove trailing &
//     paramString = paramString.slice(0, -1);

//     // Add passphrase if exists
//     if (this.passphrase) {
//       paramString += `&passphrase=${encodeURIComponent(this.passphrase).replace(/%20/g, '+')}`;
//     }

//     return crypto.createHash('md5').update(paramString).digest('hex');
//   }

//   async verifyITN(data: PayfastITNData, clientIp: string): Promise<boolean> {
//     // 1. Verify source IP
//     const allowedIps = [
//       '104.18.0.0', '104.18.1.0', '172.64.0.0', // PayFast IP ranges
//     ];
//     if (!allowedIps.includes(clientIp)) {
//       throw new Error('Invalid IP source');
//     }

//     // 2. Verify signature
//     const { signature, ...payload } = data;
//     const expectedSignature = this.generateSignature(payload as any);
//     if (signature !== expectedSignature) {
//       throw new Error('Invalid signature');
//     }

//     // 3. Verify payment status
//     if (data.payment_status !== 'COMPLETE') {
//       return false;
//     }

//     return true;
//   }
// }

/*
import crypto from 'crypto';
import axios from 'axios';

export interface PayfastPaymentData {
  amount: number;
  item_name: string;
  item_description?: string;
  email_address: string;
  name_first?: string;
  name_last?: string;
  m_payment_id: string; // Your order ID
  custom_int1?: number;
  custom_str1?: string;
}

export interface PayfastITNData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  amount_gross: number;
  amount_fee: number;
  amount_net: number;
  name_first: string;
  name_last: string;
  email_address: string;
  signature: string;
  // ... other fields
}

export class PayfastService {
  private merchantId: string;
  private merchantKey: string;
  private passphrase: string;
  private isSandbox: boolean;

  constructor() {
    this.merchantId = process.env.PAYFAST_MERCHANT_ID!;
    this.merchantKey = process.env.PAYFAST_MERCHANT_KEY!;
    this.passphrase = process.env.PAYFAST_PASSPHRASE!;
    this.isSandbox = process.env.NODE_ENV !== 'production';
  }

  private getBaseUrl(): string {
    return this.isSandbox
      ? 'https://sandbox.payfast.co.za'
      : 'https://www.payfast.co.za';
  }

  generatePaymentForm(data: PayfastPaymentData): {
    url: string;
    fields: Record<string, string>;
  } {
    const fields: Record<string, string> = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      amount: data.amount.toFixed(2),
      item_name: data.item_name,
      email_address: data.email_address,
      m_payment_id: data.m_payment_id,
      return_url: process.env.SUCCESS_URL!,
      cancel_url: process.env.CANCEL_URL!,
      notify_url: `${process.env.APP_URL}/api/webhooks/payfast`,
    };

    if (data.item_description) fields.item_description = data.item_description;
    if (data.name_first) fields.name_first = data.name_first;
    if (data.name_last) fields.name_last = data.name_last;

    // Generate signature
    fields.signature = this.generateSignature(fields);

    return {
      url: `${this.getBaseUrl()}/eng/process`,
      fields,
    };
  }

  generateSignature(data: Record<string, string>): string {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(data).sort();
    let paramString = '';

    for (const key of sortedKeys) {
      if (key !== 'signature' && data[key] !== '') {
        paramString += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
      }
    }

    // Remove trailing &
    paramString = paramString.slice(0, -1);

    // Add passphrase if exists
    if (this.passphrase) {
      paramString += `&passphrase=${encodeURIComponent(this.passphrase).replace(/%20/g, '+')    }`;
    }

    return crypto.createHash('md5').update(paramString).digest('hex');
  }
}
*/