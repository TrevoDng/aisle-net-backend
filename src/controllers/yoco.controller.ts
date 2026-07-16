import { Request, Response } from 'express';
import { YocoService } from '../services/yoco.service';
import { IdempotencyService } from '../services/idempotency.service';
import { Order } from '../models';
import { YocoWebhookEvent } from '../types/payment.types';

export class YocoController {
  private yoco = new YocoService();
  private idempotency = new IdempotencyService();

  createPaymentIntent = async (req: Request, res: Response) => {
    try {
      const { amount, currency = 'ZAR', metadata, idempotencyKey } = req.body;

      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const frontendUrl = req.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
      const backendUrl = req.backendUrl || process.env.APP_URL || `http://${req.get('host')}`;

      // Convert amount to cents
      const amountInCents = Math.round(amount * 100);

      // Use idempotency
      const result = await this.idempotency.getOrProcess(
        idempotencyKey,
        async () => {
          // Create order using Sequelize
          const order = await Order.create({
            orderNumber: `ORD-${Date.now()}`,
            amount: amount,
            currency: currency,
            customerEmail: metadata?.email || 'unknown@example.com',
            status: 'PENDING',
            metadata: {
              ...metadata,
              frontendUrl,
              backendUrl,
            },
          });

          // Create Yoco payment intent
          const paymentIntent = await this.yoco.createPaymentIntent(
            {
              amount: amountInCents,
              currency,
              metadata: { 
                ...metadata, 
                orderId: order.id, 
                orderNumber: order.orderNumber,
                frontendUrl, 
                backendUrl,
              },
            },
            idempotencyKey
          );

          return {
            paymentId: paymentIntent.id,
            clientSecret: paymentIntent.clientSecret,
            orderId: order.id,
            orderNumber: order.orderNumber,
          };
        }
      );

      res.json(result);
    } catch (error: any) {
      console.error('Yoco create payment intent error:', error);
      res.status(500).json({ error: error.message || 'Failed to create payment intent' });
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      // Verify signature
      const signature = req.headers['yoco-signature'] as string;
      if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
      }

      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
      if (!rawBody) {
        return res.status(400).json({ error: 'Missing raw body' });
      }

      const isValid = this.yoco.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event: YocoWebhookEvent = req.body;

      // Process event
      switch (event.type) {
        case 'payment.succeeded':
          await this.handlePaymentSucceeded(event.data);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event.data);
          break;
        case 'payment.refunded':
          await this.handlePaymentRefunded(event.data);
          break;
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Yoco webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  private async handlePaymentSucceeded(data: any) {
    const { id, metadata } = data;
    
    // Update order using Sequelize
    const order = await Order.findOne({ where: { id: metadata.orderId } });
    if (order) {
      await order.update({
        status: 'PAID',
        paymentId: id,
        paymentMethod: 'yoco',
        metadata: data,
      });
      console.log('Yoco payment succeeded for order:', order.orderNumber);
    }
  }

  private async handlePaymentFailed(data: any) {
    const { metadata } = data;
    
    const order = await Order.findOne({ where: { id: metadata.orderId } });
    if (order) {
      await order.update({
        status: 'FAILED',
        metadata: data,
      });
    }
  }

  private async handlePaymentRefunded(data: any) {
    const { metadata } = data;
    
    const order = await Order.findOne({ where: { id: metadata.orderId } });
    if (order) {
      await order.update({
        status: 'REFUNDED',
        metadata: data,
      });
    }
  }
}