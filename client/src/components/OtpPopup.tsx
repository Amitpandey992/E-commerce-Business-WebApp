import React, { useState } from "react";
import axios from "axios";
import { notify } from "../utils/util";

interface OtpPopupProps {
    phone: string;
    onClose: () => void;
    onVerified: () => void;
}

const OtpPopup: React.FC<OtpPopupProps> = ({ phone, onClose, onVerified }) => {
    const [otp, setOtp] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    // Send OTP
    const sendOtp = async () => {
        try {
            setLoading(true);
            await axios.post("/api/v1/payments/order/cod/send-otp", { phone });
            notify("OTP sent successfully!", "success");
            setSent(true);
        } catch (err: any) {
            notify(
                err?.response?.data?.message || "Failed to send OTP",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const verifyOtp = async () => {
        try {
            setLoading(true);
            await axios.post("/api/payment/verify-otp", { phone, otp });
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
                            maxLength={5}
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 text-center text-lg tracking-widest mb-4"
                        />
                        <button
                            onClick={verifyOtp}
                            disabled={loading || otp.length < 4}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
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
