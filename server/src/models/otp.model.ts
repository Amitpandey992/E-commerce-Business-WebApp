import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        phoneNumber: {
            type: String,
        },
        otp: {
            type: String,
        },
    },
    { timestamps: true }
);

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
