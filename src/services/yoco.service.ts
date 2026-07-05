// src/services/yoco.service.ts
import axios from 'axios';
import crypto from 'crypto';

export interface YocoPaymentIntent {
  amount: number; // in cents
  currency: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface YocoWebhookEvent {
  id: string;
  type: 'payment.succeeded' | 'payment.failed' | 'payment.refunded';
  data: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: Record<string, any>;
    created: string;
  };
}

export class YocoService {
  private secretKey: string;
  private publicKey: string;
  private webhookSecret: string;

  constructor() {
    this.secretKey = process.env.YOCO_SECRET_KEY!;
    this.publicKey = process.env.YOCO_PUBLIC_KEY!;
    this.webhookSecret = process.env.YOCO_WEBHOOK_SECRET!;
  }

  async createPaymentIntent(data: YocoPaymentIntent, idempotencyKey?: string) {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      };

      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await axios.post(
        'https://online.yoco.com/v1/payments',
        {
          amount: data.amount,
          currency: data.currency,
          metadata: data.metadata,
        },
        { headers }
      );

      return response.data;
    } catch (error: any) {
      console.error('Yoco create payment intent error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create payment intent');
    }
  }

  async capturePayment(paymentId: string, idempotencyKey?: string) {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await axios.post(
      `https://online.yoco.com/v1/payments/${paymentId}/capture`,
      {},
      { headers }
    );

    return response.data;
  }

  async refundPayment(paymentId: string, amount?: number, idempotencyKey?: string) {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await axios.post(
      `https://online.yoco.com/v1/payments/${paymentId}/refunds`,
      { amount },
      { headers }
    );

    return response.data;
  }

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://online.yoco.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Yoco get payment status error:', error.response?.data || error.message);
      throw new Error('Failed to get payment status');
    }
  }
}

// 
// import axios from 'axios';
// import crypto from 'crypto';

// export interface YocoPaymentIntent {
//   amount: number; // in cents
//   currency: string;
//   metadata?: Record<string, any>;
//   idempotencyKey?: string;
// }

// export interface YocoWebhookEvent {
//   id: string;
//   type: 'payment.succeeded' | 'payment.failed' | 'payment.refunded';
//   data: {
//     id: string;
//     amount: number;
//     currency: string;
//     status: string;
//     metadata?: Record<string, any>;
//     created: string;
//   };
// }

// export class YocoService {
//   private secretKey: string;
//   private publicKey: string;
//   private webhookSecret: string;

//   constructor() {
//     this.secretKey = process.env.YOCO_SECRET_KEY!;
//     this.publicKey = process.env.YOCO_PUBLIC_KEY!;
//     this.webhookSecret = process.env.YOCO_WEBHOOK_SECRET!;
//   }

//   async createPaymentIntent(data: YocoPaymentIntent, idempotencyKey?: string) {
//     try {
//       const headers: Record<string, string> = {
//         'Authorization': `Bearer ${this.secretKey}`,
//         'Content-Type': 'application/json',
//       };

//       if (idempotencyKey) {
//         headers['Idempotency-Key'] = idempotencyKey;
//       }

//       const response = await axios.post(
//         'https://online.yoco.com/v1/payments',
//         {
//           amount: data.amount,
//           currency: data.currency,
//           metadata: data.metadata,
//         },
//         { headers }
//       );

//       return response.data;
//     } catch (error: any) {
//       console.error('Yoco create payment intent error:', error.response?.data || error.message);
//       throw new Error(error.response?.data?.message || 'Failed to create payment intent');
//     }
//   }

//   async capturePayment(paymentId: string, idempotencyKey?: string) {
//     const headers: Record<string, string> = {
//       'Authorization': `Bearer ${this.secretKey}`,
//       'Content-Type': 'application/json',
//     };

//     if (idempotencyKey) {
//       headers['Idempotency-Key'] = idempotencyKey;
//     }

//     const response = await axios.post(
//       `https://online.yoco.com/v1/payments/${paymentId}/capture`,
//       {},
//       { headers }
//     );

//     return response.data;
//   }

//   async refundPayment(paymentId: string, amount?: number, idempotencyKey?: string) {
//     const headers: Record<string, string> = {
//       'Authorization': `Bearer ${this.secretKey}`,
//       'Content-Type': 'application/json',
//     };

//     if (idempotencyKey) {
//       headers['Idempotency-Key'] = idempotencyKey;
//     }

//     const response = await axios.post(
//       `https://online.yoco.com/v1/payments/${paymentId}/refunds`,
//       { amount },
//       { headers }
//     );

//     return response.data;
//   }

//   verifyWebhookSignature(payload: Buffer, signature: string): boolean {
//     const expectedSignature = crypto
//       .createHmac('sha256', this.webhookSecret)
//       .update(payload)
//       .digest('hex');

//     return crypto.timingSafeEqual(
//       Buffer.from(signature),
//       Buffer.from(expectedSignature)
//     );
//   }
// }
