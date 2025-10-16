import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import Order from "../models/order.model";
import { NewOrderRequestBody, RequestWithUser } from "../types/types";
import { ApiError } from "../utils/ApiError";
import { reduceStock } from "../utils/utils";

// Create New Order
export const newOrder = asyncHandler(
    async (
        req: Request<{}, {}, NewOrderRequestBody>,
        res: Response,
        next: NextFunction
    ) => {
        const {
            orderItems,
            shippingInfo,
            discount,
            shippingCharges,
            subTotal,
            tax,
            total,
            paymentMethod,
        } = req.body;

        let normalizedPaymentMethod = (paymentMethod || "")
            .toLowerCase()
            .trim();

        normalizedPaymentMethod =
            normalizedPaymentMethod === "Cod" ? "Cod" : "Online";

        const user = (req as RequestWithUser).user;
        if (!user) {
            throw new ApiError(401, "User not authenticated");
        }

        const errors: string[] = [];
        if (!shippingInfo) errors.push("shippingInfo is required");
        if (!orderItems || orderItems.length === 0)
            errors.push("orderItems is required");
        if (!normalizedPaymentMethod) errors.push("paymentMethod is required");
        if (errors.length > 0) {
            throw new ApiError(
                400,
                `Order validation failed: ${errors.join(", ")}`
            );
        }

        const initialPaymentStatus = "Pending";

        const order = await Order.create({
            orderItems,
            shippingInfo,
            discount,
            shippingCharges,
            subTotal,
            tax,
            paymentMethod: normalizedPaymentMethod,
            paymentStatus: initialPaymentStatus,
            total,
            user: user._id,
        });

        // Reduce stock only after full confirmation (do it here for COD; for Online, do in verification to avoid reversals)
        if (normalizedPaymentMethod === "Cod") {
            await reduceStock(orderItems);
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            orderId: order._id,
            order,
        });
    }
);

// Update order status
export const updateOrderStatus = asyncHandler(
    async (req: Request, res: Response) => {
        const { orderId, status } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            res.status(404);
            throw new Error("Order not found");
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
        });
    }
);

export const updatePaymentStatus = asyncHandler(
    async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const { paymentStatus } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            res.status(404);
            throw new Error("Order not found");
        }

        order.paymentStatus = paymentStatus;
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order's payment status updated successfully.",
            order,
        });
    }
);

// Delete Order
export const deleteOrder = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const orderId = req.params.id;

        const order = await Order.findById(orderId);

        if (!order) return next(new ApiError(404, "Order not found"));

        await order.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Order deleted successfully",
        });
    }
);

// Get User Orders
export const getUserOrders = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const {
            currentPage = 1,
            pageSize = 10,
            month,
            year,
            paymentStatus,
            paymentMethod,
            status,
        } = req.query;
        const skip = (Number(currentPage) - 1) * Number(pageSize);
        const user = (req as RequestWithUser).user;

        const filter: any = { user: user._id };

        if (month || year) {
            const startDate = new Date(
                Number(year) || new Date().getFullYear(),
                month ? Number(month) - 1 : 0,
                1
            );

            const endDate = new Date(
                Number(year) || new Date().getFullYear(),
                month ? Number(month) : 12,
                0,
                23,
                59,
                59,
                999
            );

            filter.createdAt = { $gte: startDate, $lte: endDate };
        }

        if (paymentStatus) {
            filter.paymentStatus = paymentStatus;
        }

        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }

        if (status) {
            filter.status = status;
        }

        const [orders, totalItems] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(pageSize)),
            Order.countDocuments({ user: user._id }),
        ]);

        const totalPages = Math.ceil(totalItems / Number(pageSize));

        return res.status(200).json({
            success: true,
            orders,
            pagination: {
                currentPage,
                pageSize,
                totalItems,
                totalPages,
            },
        });
    }
);

// Get All Orders
export const getAllOrders = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const {
            currentPage = 1,
            pageSize = 10,
            month,
            year,
            paymentStatus,
            paymentMethod,
            status,
        } = req.query;
        const skip = (Number(currentPage) - 1) * Number(pageSize);

        const filter: any = {};

        if (month || year) {
            const startDate = new Date(
                Number(year) || new Date().getFullYear(),
                month ? Number(month) - 1 : 0,
                1
            );

            const endDate = new Date(
                Number(year) || new Date().getFullYear(),
                month ? Number(month) : 12,
                0,
                23,
                59,
                59,
                999
            );

            filter.createdAt = { $gte: startDate, $lte: endDate };
        }

        if (paymentStatus) {
            filter.paymentStatus = paymentStatus;
        }

        if (paymentMethod && typeof paymentMethod === "string") {
            filter.paymentMethod =
                paymentMethod.slice(0, 1).toUpperCase() +
                paymentMethod.slice(1, paymentMethod.length);
        }

        if (status && typeof status === "string") {
            filter.status =
                status.slice(0, 1).toUpperCase() +
                status.slice(1, status.length);
        }
        const [orders, totalItems] = await Promise.all([
            Order.find(filter)
                .populate("user", "name email")
                .skip(skip)
                .limit(Number(pageSize)),
            Order.countDocuments({}),
        ]);
        const totalPages = Math.ceil(totalItems / Number(pageSize));

        return res.status(200).json({
            success: true,
            orders,
            pagination: {
                currentPage,
                pageSize,
                totalItems,
                totalPages,
            },
        });
    }
);

// Get Single Order
export const getOrder = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const orderId = req.params.id;

        const order = await Order.findById(orderId).populate(
            "user",
            "name email"
        );

        if (!order) return next(new ApiError(404, "Order not found"));

        return res.status(200).json({
            success: true,
            order,
        });
    }
);
