import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { razorpay, razorpayPublicKey } from "../config/razorpay.config";
import crypto from "crypto";
import Otp from "../models/otp.model";
import bcrypt from "bcrypt";
import Order from "../models/order.model";
import { reduceStock } from "../utils/utils";

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

export const sendOtpForCod = asyncHandler(async (req, res, next) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return next(new ApiError(400, "Phone number is required"));
        }

        const apiKey = process.env.TWO_FACTOR_API_KEY;

        const apiUrl = `https://2factor.in/API/V1/${apiKey}/SMS/+91${phone}/AUTOGEN/ranisabysword`;

        // const apiUrl = `https://2factor.in/API/V1/${apiKey}/SMS/AUTOGEN/+91${phone}/ranisabysword`;
        const response = await fetch(apiUrl, { method: "GET" });
        const data = await response.json();

        console.log("2Factor API Response:", data);

        if (data.Status !== "Success") {
            throw new Error("Failed to send OTP via SMS");
        }

        await Otp.create({
            phoneNumber: phone,
            otp: data.Details, // Save sessionId
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            data: data.Details,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error?.response?.data?.message || error.message,
        });
    }
});

export const verifyOtpForCod = asyncHandler(async (req, res, next) => {
    try {
        const { phone, otp, orderId } = req.body;

        if (!orderId) {
            throw new ApiError(400, "Order ID required for COD verification");
        }
        const order = await Order.findById(orderId);
        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        if (!phone || !otp) {
            return next(new ApiError(400, "All fields are required"));
        }

        const record = await Otp.findOne({ phoneNumber: phone }).sort({
            createdAt: -1,
        });

        if (!record) {
            order.paymentStatus = "Failed";
            await order.save();
            return next(new ApiError(400, "Otp not found"));
        }

        const apiKey = process.env.TWO_FACTOR_API_KEY;

        const verifyUrl = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${record.otp}/${otp}`;
        const response = await fetch(verifyUrl, { method: "GET" });
        const data = await response.json();

        console.log("OTP verify response:", data);

        if (data.Status !== "Success") {
            order.paymentStatus = "Failed";
            await order.save();
            return next(new ApiError(400, "Invalid or expired OTP"));
        }

        // Build custom confirmation message
        let itemsMessage = order.orderItems
            .map((item: any) => `${item.name} - ₹${item.price}`)
            .join(", ");
        const totalMessage = `Your order #${orderId} placed successfully via COD! Items: ${itemsMessage}. Total: ₹${order.total}. Thank you!`;

        // Send custom SMS via 2factor.in
        const smsApiKey = process.env.TWO_FACTOR_API_KEY;
        const smsUrl = `https://2factor.in/API/V1/${smsApiKey}/ADDON_SERVICES/SEND/TSMS`;
        const smsResponse = await fetch(smsUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                From: "ranisa", // Replace with your registered Sender ID
                To: `+91${phone}`,
                Msg: totalMessage,
                SendAt: "", // Immediate send (empty for now)
            }),
        });

        const smsData = await smsResponse.json();
        console.log("SMS Confirmation Response:", smsData);

        if (smsData.Status !== "Success") {
            console.error("SMS send failed:", smsData);
            // Don't throw error – order is still successful, SMS is secondary
        }
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
