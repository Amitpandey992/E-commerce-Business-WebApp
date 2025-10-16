import express from 'express';
import { createRazorpayOrder, sendOtpForCod, verifyOtpForCod, verifyRazorpayPayment } from '../controllers/payment.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

// Authenticated user routes
router.post('/order/cod/send-otp', authenticateUser, sendOtpForCod);
router.post('/order/cod/verify-otp', authenticateUser, verifyOtpForCod);
router.post('/order', authenticateUser, createRazorpayOrder);
router.post('/verify', authenticateUser, verifyRazorpayPayment);

export default router;