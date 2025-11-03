import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import path from "path";
import connectDB from "./config/db.config";
import firebaseApp from "./config/firebase.config";

import authRoutes from "./routes/auth.routes";
import couponRoutes from "./routes/coupon.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import productRoutes from "./routes/product.route";
import statsRoutes from "./routes/stats.route";

import { apiErrorMiddleware } from "./utils/ApiError";
import winston from "winston";

firebaseApp.firestore();

const app: Application = express();

const PORT: any = process.env.PORT || 8000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Apply middlewares
app.use(cors({ credentials: true, origin: CLIENT_URL }));
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(compression());
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", limiter);

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/stats", statsRoutes);

// Serve static files (should be placed after API routes)
// if (process.env.NODE_ENV === "production") {
//     app.use(express.static(path.join(__dirname, "../client/dist")));
//     app.get("*", (req: Request, res: Response) => {
//         res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
//     });
// } else if (process.env.NODE_ENV === "development") {
//     app.get("/", (req: Request, res: Response) => {
//         res.send("API is running... 🚀 [Development Mode]");
//     });
// }

app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("/", (req, res) => {
    res.send("API is running... 🚀 [Development Mode]");
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    winston.error(err.message, err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Server Error",
    });
});

app.use(apiErrorMiddleware);

connectDB().then(() =>
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    })
);
