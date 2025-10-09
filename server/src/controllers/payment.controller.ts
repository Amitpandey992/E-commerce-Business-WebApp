import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { razorpay, razorpayPublicKey } from "../config/razorpay.config";
import crypto from "crypto";
import twilio from "twilio";
import Otp from "../models/otp.model";
import bcrypt from "bcrypt";

export const createRazorpayOrder = asyncHandler(async (req, res, next) => {
    let { amount, receipt } = req.body as { amount: number; receipt?: string };

    if (!amount) {
        return next(new ApiError(400, "Please provide amount"));
    }

    const paiseAmount = Math.round(amount * 100);

    if (paiseAmount < 100) {
        return next(
            new ApiError(400, `Amount must be at least ₹1. Got ₹${amount}.`)
        );
    }

    const order = await razorpay.orders.create({
        amount: paiseAmount,
        currency: "INR",
        receipt: receipt || `rcpt_${Date.now()}`,
    });

    return res.status(200).json({
        success: true,
        key: razorpayPublicKey,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
    });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body as Record<string, string>;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(new ApiError(400, "Missing payment verification fields"));
    }

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
        .update(sign)
        .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    if (!isAuthentic) {
        return next(new ApiError(400, "Invalid payment signature"));
    }

    return res.status(200).json({ success: true });
});

export const sendOtpForCod = asyncHandler(async (req, res, next) => {
    try {
        const accountSid = process.env.TWILIO_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = twilio(accountSid, authToken);

        const { phone } = req.body;
        if (!phone) {
            return next(new ApiError(400, "All fields are required"));
        }
        const otp = Math.floor(10000 + Math.random() * 90000);

        const message = await client.messages.create({
            body: `Your OTP is ${otp}`,
            from: "+12025551234",
            to: `+91${phone}`,
        });

        const hashedOtp = await bcrypt.hash(otp.toString(), 10);

        await Otp.create({
            phoneNumber: phone,
            otp: hashedOtp,
        });

        return res.status(200).json({ success: true, sid: message.sid });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error?.response?.data?.message || error?.message,
        });
    }
});

export const verifyOtpForCod = asyncHandler(async (req, res, next) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return next(new ApiError(400, "All fields are required"));
    }

    const getOtpInfo = await Otp.findOne({ phoneNumber: phone });
});
