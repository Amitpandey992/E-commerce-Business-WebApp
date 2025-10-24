import nodemailer from "nodemailer";
import EmailTemplate from "../utils/emailTemplate";

const sendOtpWithNodemailer = async (email: string, otp: string) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const htmlTemplate = EmailTemplate.getOTPTemplate(otp);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "🔐 Your Secure OTP Code",
        html: htmlTemplate,
        text: `Your OTP for signup is: ${otp}. This code will expire in 10 minutes. Please do not share this code with anyone.`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ OTP sent:", info.response);
        return info;
    } catch (error) {
        console.error("❌ Error sending OTP:", error);
        throw new Error(error.message || "Failed to send OTP");
    }
};

const orderConfirmationNodemailer = async (
    email: string,
    orderId: string,
    customeText: string
) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const htmlTemplate = EmailTemplate.getOrderConfirmationTemplate(orderId);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "📦 Your Order Confirmation",
        html: htmlTemplate,
        // text: `Your order #${orderId} has been confirmed! Thank you for shopping with us.`,
        text: customeText,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Order confirmation sent:", info.response);
        return info;
    } catch (error) {
        console.error("❌ Error sending order confirmation:", error);
        throw new Error(error.message || "Failed to send order confirmation");
    }
};

export { sendOtpWithNodemailer, orderConfirmationNodemailer };
