import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
    },
    otp: {
        type: String,
    },
});

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
