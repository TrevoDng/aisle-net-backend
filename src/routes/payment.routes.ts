import { Router } from 'express';
import { PayfastController } from '../controllers/payfast.controller';
import { YocoController } from '../controllers/yoco.controller';
import { OzowController } from '../controllers/ozow.controller';
import { verifyUserToken } from '../services/auth.service';
import Order from '../models/Order';

const router = Router();

// Instantiate controllers
const payfastController = new PayfastController();
const yocoController = new YocoController();
const ozowController = new OzowController();

// PayFast routes
router.post('/payfast/initiate', payfastController.initiatePayment);
router.post('/webhooks/payfast', payfastController.handleWebhook);

// Yoco routes
router.post('/yoco/create-payment', yocoController.createPaymentIntent);
router.post('/webhooks/yoco', yocoController.handleWebhook);

// Ozow routes
router.post('/ozow/initiate', ozowController.initiatePayment);
router.post('/webhooks/ozow', ozowController.handleWebhook);
router.get('/ozow/return', ozowController.handleReturn);

// src/routes/payment.routes.ts (add this route)
router.get('/status/:orderId', verifyUserToken, async (req, res) => {
  try {
    const orderIdParam = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    if (!orderIdParam) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await Order.findByPk(orderIdParam);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      amount: order.amount,
      orderNumber: order.orderNumber,
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
    });


export default router;