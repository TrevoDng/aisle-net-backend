// ===== Yoco Types =====
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

// ===== Ozow Types =====
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

// ===== PayFast Types =====
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
}

// ===== Generic Payment Types =====
export interface PaymentInitiateRequest {
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  email?: string;
  customerName?: string;
}