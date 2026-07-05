import { Request, Response } from 'express';
import { OzowService } from '../services/ozow.service';
import { IdempotencyService } from '../services/idempotency.service';
import { Order } from '../models';
import { OzowNotification } from '../types/payment.types';

export class OzowController {
  private ozow = new OzowService();
  private idempotency = new IdempotencyService();

  initiatePayment = async (req: Request, res: Response) => {
    try {
      const { amount, customerEmail, customerName, idempotencyKey } = req.body;

      if (!amount || !customerEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await this.idempotency.getOrProcess(
        idempotencyKey,
        async () => {
          // Create order using Sequelize
          const order = await Order.create({
            orderNumber: `ORD-${Date.now()}`,
            amount: parseFloat(amount),
            currency: 'ZAR', // Assuming ZAR for Ozow, adjust as needed
            customerEmail,
            customerName,
            status: 'PENDING',
          });

          // Generate Ozow payment request
          const paymentRequest = this.ozow.generatePaymentRequest({
            amount: parseFloat(amount),
            transactionReference: order.orderNumber,
            bankReference: `PAY-${order.orderNumber}`,
            customer: customerName || customerEmail,
          });

          return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            ozowUrl: 'https://pay.ozow.com',
            ozowParams: paymentRequest,
          };
        }
      );

      res.json(result);
    } catch (error: any) {
      console.error('Ozow initiation error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const notification = req.body as OzowNotification;

      // Verify IP (implement IP whitelist)
      const allowedIps = ['197.97.192.0', '197.97.193.0']; // Get from Ozow
      if (!allowedIps.includes(req.ip!)) {
        return res.status(403).send('Forbidden');
      }

      // Verify hash
      const isValid = this.ozow.verifyNotificationHash(notification);
      if (!isValid) {
        return res.status(400).send('Invalid hash');
      }

      // Update order status using Sequelize
      const order = await Order.findOne({ where: { orderNumber: notification.TransactionReference } });
      if (!order) {
        return res.status(404).send('Order not found');
      }

      let status: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING';
      if (notification.TransactionStatus === 'Complete') {
        status = 'PAID';
      } else if (notification.TransactionStatus === 'Cancelled' || notification.TransactionStatus === 'Error') {
        status = 'FAILED';
      }

      await order.update({
        status,
        paymentId: notification.TransactionId,
        paymentMethod: 'ozow',
        metadata: notification,
      });

      if (status === 'PAID') {
        console.log('Ozow payment successful for order:', order.orderNumber);
      }

      res.status(200).send('OK');
    } catch (error: any) {
      console.error('Ozow webhook error:', error);
      res.status(500).send('ERROR');
    }
  };

  handleReturn = async (req: Request, res: Response) => {
    const { TransactionReference, TransactionStatus } = req.query;

    if (TransactionStatus === 'Complete') {
      res.redirect(`${process.env.SUCCESS_URL}?reference=${TransactionReference}`);
    } else {
      res.redirect(`${process.env.CANCEL_URL}?reference=${TransactionReference}`);
    }
  };
}