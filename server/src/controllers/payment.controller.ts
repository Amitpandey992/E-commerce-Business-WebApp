import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { razorpay, razorpayPublicKey } from "../config/razorpay.config";
import crypto from "crypto";
import Otp from "../models/otp.model";
import bcrypt from "bcrypt";
import Order from "../models/order.model";
import { reduceStock } from "../utils/utils";
import { RequestWithUser } from "../types/types";
import {
    orderConfirmationNodemailer,
    sendOtpWithNodemailer,
} from "../config/nodemailer";

// Helper: Update order's paymentStatus and status based on payment outcome
const updateOrderPaymentStatus = async (
    orderId: string,
    paymentStatus: "Paid" | "Failed" | "Pending",
    orderStatus?: string
) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    order.paymentStatus = paymentStatus;
    if (orderStatus)
        order.status = orderStatus as
            | "Pending"
            | "Processing"
            | "Shipped"
            | "Delivered";

    // Reduce stock only on success
    if (paymentStatus === "Paid" || paymentStatus === "Pending") {
        await reduceStock(order.orderItems as any);
    }

    await order.save();
    return order;
};

export const createRazorpayOrder = asyncHandler(async (req, res, next) => {
    let { amount, receipt, orderId } = req.body;

    if (!orderId) {
        throw new ApiError(400, "Order ID required for Razorpay");
    }

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
        notes: { orderId },
    });

    return res.status(200).json({
        success: true,
        key: razorpayPublicKey,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
    });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId,
    } = req.body;

    // Validate required fields
    if (
        !orderId ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
    ) {
        throw new ApiError(400, "Missing payment verification fields");
    }

    // Signature verification
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(sign)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        // Update to Failed on signature fail
        await updateOrderPaymentStatus(orderId, "Failed", "Pending");
        throw new ApiError(400, "Invalid payment signature");
    }

    // Fetch real payment details
    let payment;
    try {
        payment = await razorpay.payments.fetch(razorpay_payment_id);
        console.log("Full Payment Response:", JSON.stringify(payment, null, 2));
    } catch (fetchError: any) {
        await updateOrderPaymentStatus(orderId, "Failed", "Pending");
        throw new ApiError(
            400,
            `Payment fetch failed: ${fetchError.description || "Unknown"}`
        );
    }

    // Check success
    const isSuccessful = payment.status === "captured";
    if (!isSuccessful) {
        const reason =
            payment.error_reason ||
            payment.error_description ||
            "Payment not captured";
        await updateOrderPaymentStatus(orderId, "Failed", "Pending");
        throw new ApiError(400, `Payment failed: ${reason}`);
    }

    // Success: Update to Paid and Processing
    const updatedOrder = await updateOrderPaymentStatus(
        orderId,
        "Paid",
        "Processing"
    );

    res.status(200).json({
        success: true,
        message: "Payment successful",
        order: updatedOrder,
    });
});

export const sendOtpForCod = asyncHandler(
    async (req: RequestWithUser, res, next) => {
        try {
            const { email } = req.body;
            if (!email) {
                return next(new ApiError(400, "Email is required"));
            }
            const twentyFourHoursAgo = new Date(
                Date.now() - 24 * 60 * 60 * 1000
            );
            const otpCount = await Otp.countDocuments({
                email,
                createdAt: { $gte: twentyFourHoursAgo },
            });

            if (otpCount >= 3) {
                return {
                    success: false,
                    data: null,
                    message:
                        "OTP limit exceeded. You can only request 3 OTPs per day.",
                };
            }

            await Otp.deleteMany({ user: req.user._id, email });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const hashedOtp = await bcrypt.hash(otp, 10);

            await Otp.create({ user: req.user._id, email, otp: hashedOtp });

            sendOtpWithNodemailer(email, otp);

            return res.status(200).json({
                success: true,
                message: "OTP sent successfully",
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error?.response?.data?.message || error.message,
            });
        }
    }
);

export const verifyOtpForCod = asyncHandler(async (req, res, next) => {
    try {
        const { email, otp, orderId } = req.body;

        if (!orderId) {
            throw new ApiError(400, "Order ID required for COD verification");
        }
        const order = await Order.findById(orderId);
        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        if (!email || !otp) {
            return next(new ApiError(400, "All fields are required"));
        }

        const record = await Otp.findOne({ email }).sort({
            createdAt: -1,
        });

        if (!record) {
            order.paymentStatus = "Failed";
            await order.save();
            return next(new ApiError(400, "Otp not found"));
        }

        const isOtpValid = await bcrypt.compare(otp, record.otp);
        if (!isOtpValid) {
            order.paymentStatus = "Failed";
            await order.save();
            return next(new ApiError(400, "Invalid OTP"));
        }

        // Build custom confirmation message
        let itemsMessage = order.orderItems
            .map((item: any) => `${item.name} - ₹${item.price}`)
            .join(", ");
        const totalMessage = `Your order #${orderId} placed successfully via COD! Items: ${itemsMessage}. Total: ₹${order.total}. Thank you!`;

        await orderConfirmationNodemailer(email, orderId, totalMessage);

        order.paymentMethod = "Cod"; // Explicitly set to COD
        await order.save();
        const updatedOrder = await updateOrderPaymentStatus(
            orderId,
            "Pending", // COD is Pending after verification
            "Processing"
        );

        return res.status(200).json({
            success: true,
            message: "COD confirmed successfully",
            order: updatedOrder,
        });
    } catch (error) {
        console.error(error);
        return res.status(400).json({
            success: false,
            message: error?.response?.data?.message || error.message,
        });
    }
});
