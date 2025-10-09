// Minimal module typing to satisfy TS without @types
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Razorpay from 'razorpay';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not configured');
}

export const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});

export const razorpayPublicKey = RAZORPAY_KEY_ID;


