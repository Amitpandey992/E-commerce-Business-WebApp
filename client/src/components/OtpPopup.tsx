/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { notify } from "../utils/util";

interface OtpPopupProps {
    phone: string;
    orderId?: string;
    onClose: () => void;
    onVerified: () => void;
}

const OtpPopup: React.FC<OtpPopupProps> = ({
    phone,
    orderId,
    onClose,
    onVerified,
}) => {
    const [otp, setOtp] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingForResend, setLoadingForResend] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // 🕒 countdown for resend
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    // ✅ Send OTP (used for first send)
    const sendOtp = async () => {
        try {
            setLoading(true);
            await axios.post("/api/v1/payments/order/cod/send-otp", { phone });
            notify("OTP sent successfully!", "success");
            setSent(true);
            setResendTimer(60); // 60 seconds cooldown
        } catch (err: any) {
            notify(
                err?.response?.data?.message || "Failed to send OTP",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // 🔁 Resend OTP (separate logic)
    const resendOtp = async () => {
        if (resendTimer > 0) return; // prevent spamming
        try {
            setLoadingForResend(true);
            await axios.post("/api/v1/payments/order/cod/send-otp", { phone });
            notify("OTP resent successfully!", "success");
            setResendTimer(60); // restart cooldown
        } catch (err: any) {
            notify(
                err?.response?.data?.message || "Failed to resend OTP",
                "error"
            );
        } finally {
            setLoadingForResend(false);
        }
    };

    // ✅ Verify OTP
    const verifyOtp = async () => {
        try {
            setLoading(true);
            await axios.post("/api/v1/payments/order/cod/verify-otp", {
                phone,
                otp,
                orderId,
            });
            notify("OTP verified successfully!", "success");
            onVerified();
            onClose();
        } catch (err: any) {
            notify(err?.response?.data?.message || "Invalid OTP", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                    COD Verification
                </h2>

                {!sent ? (
                    <>
                        <p className="text-gray-600 text-center mb-4">
                            We’ll send an OTP to your phone number:
                            <span className="font-medium text-gray-800 block mt-1">
                                +91 {phone}
                            </span>
                        </p>
                        <button
                            onClick={sendOtp}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
                        >
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </>
                ) : (
                    <>
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 text-center text-lg tracking-widest mb-4"
                        />

                        <button
                            onClick={verifyOtp}
                            disabled={loading || otp.length < 6}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>

                        <button
                            onClick={resendOtp}
                            disabled={loadingForResend || resendTimer > 0}
                            className={`w-full mt-4 py-2 rounded-lg font-medium text-white ${
                                resendTimer > 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {loadingForResend
                                ? "Resending..."
                                : resendTimer > 0
                                ? `Resend in ${resendTimer}s`
                                : "Resend OTP"}
                        </button>
                    </>
                )}

                <button
                    onClick={onClose}
                    className="mt-4 text-gray-500 text-sm hover:text-gray-700 w-full text-center"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default OtpPopup;
