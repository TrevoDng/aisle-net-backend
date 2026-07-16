import { Request, Response } from 'express';
import { PayfastService } from '../services/payfast.service';
import { IdempotencyService } from '../services/idempotency.service';
import { Order } from '../models';
import { PayfastITNData } from '../types/payment.types';

export class PayfastController {
  private payfast = new PayfastService();
  private idempotency = new IdempotencyService();

  initiatePayment = async (req: Request, res: Response) => {
    try {
      const { amount, itemName, email, idempotencyKey, firstName, lastName } = req.body;

      // Validate input
      if (!amount || !itemName || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const frontendUrl = req.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
      const backendUrl = req.backendUrl || process.env.APP_URL || `http://${req.get('host')}`;

      // Use idempotency
      const result = await this.idempotency.getOrProcess(
        idempotencyKey,
        async () => {
          // Create order in database using Sequelize
          const order = await Order.create({
            orderNumber: `ORD-${Date.now()}`,
            amount: parseFloat(amount),
            currency: 'ZAR', // Assuming ZAR for PayFast, adjust as needed
            customerEmail: email,
            status: 'PENDING',
          });

          // Generate PayFast form data
          const paymentData = this.payfast.generatePaymentForm({
            amount: parseFloat(amount),
            item_name: itemName,
            email_address: email,
            m_payment_id: order.orderNumber,
            name_first: firstName || '',
            name_last: lastName || '',
          },
          frontendUrl,
          backendUrl);

          return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            payfastUrl: paymentData.url,
            payfastFields: paymentData.fields,
          };
        }
      );

      res.json(result);
    } catch (error) {
      console.error('PayFast initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate payment' });
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const data = req.body as PayfastITNData;
      const clientIp = req.ip!;

      // Verify ITN
      const isValid = await this.payfast.verifyITN(data, clientIp);
      if (!isValid) {
        return res.status(400).send('Invalid ITN');
      }

      // Update order status using Sequelize
      const order = await Order.findOne({ where: { orderNumber: data.m_payment_id } });
      if (!order) {
        return res.status(404).send('Order not found');
      }

      await order.update({
        status: data.payment_status === 'COMPLETE' ? 'PAID' : 'FAILED',
        paymentId: data.pf_payment_id,
        paymentMethod: 'payfast',
        metadata: data,
      });

      // Send confirmation email, trigger fulfillment, etc.
      if (order.status === 'PAID') {
        await this.handleSuccessfulPayment(order);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('PayFast webhook error:', error);
      res.status(500).send('ERROR');
    }
  };

  private async handleSuccessfulPayment(order: any) {
    // Implement your post-payment logic here
    // e.g., send email, update inventory, grant access
    console.log('Payment successful for order:', order.orderNumber);
  }
}