/* Razorpay Checkout replaces Stripe Elements */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useNewOrderMutation } from "../redux/api/order.api";
import {
    useCreateRazorpayOrderMutation,
    useVerifyRazorpayPaymentMutation,
} from "../redux/api/payment.api";
import { resetCart } from "../redux/reducers/cart.reducer";
import { RootState } from "../redux/store";
import { NewOrderRequest } from "../types/api-types";
import { notify } from "../utils/util";
import BackButton from "../components/common/BackBtn";
import OtpPopup from "./OtpPopup";

// Define the CheckoutForm component
const CheckoutForm: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state: RootState) => state.user);
    const {
        shippingInfo,
        cartItems,
        subTotal,
        tax,
        discount,
        shippingCharges,
        total,
    } = useSelector((state: RootState) => state.cart);

    const [paymentMethod, setPaymentMethod] = useState("");
    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [newOrder] = useNewOrderMutation();
    const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
    const [verifyRazorpayPayment] = useVerifyRazorpayPaymentMutation();
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const extractMessage = (err: unknown, fallback: string): string => {
        if (typeof err === "object" && err !== null) {
            if ("data" in err) {
                const data = (err as { data?: { message?: string } }).data;
                if (data && typeof data.message === "string")
                    return data.message;
            }
            if (
                "message" in err &&
                typeof (err as { message?: string }).message === "string"
            ) {
                return (err as { message?: string }).message as string;
            }
        }
        return fallback;
    };

    // Function to handle form submission
    const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user) {
            notify("Please login to place order", "error");
            return;
        }

        setIsProcessing(true);

        const orderData: NewOrderRequest = {
            shippingCharges,
            shippingInfo,
            tax,
            discount,
            total,
            subTotal,
            orderItems: cartItems,
            userId: user?._id,
        };

        if (paymentMethod === "cod") {
            setIsProcessing(false);
            setShowOtpPopup(true);

            try {
                console.log("hello");
            } catch (err: unknown) {
                const message = extractMessage(
                    err,
                    "Payment verification failed"
                );
                notify(message, "error");
            } finally {
                setIsProcessing(false);
            }
        } else {
            try {
                const razorpayOrder = await createRazorpayOrder({
                    amount: total,
                }).unwrap();

                type RazorpayHandlerResponse = {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                };

                type RazorpayOptions = {
                    key: string;
                    amount: number;
                    currency: string;
                    name: string;
                    description: string;
                    order_id: string;
                    prefill: { name: string; email: string; contact: string };
                    handler: (
                        response: RazorpayHandlerResponse
                    ) => Promise<void>;
                    modal: { ondismiss: () => void };
                    payment_options: {
                        upi: boolean;
                    };
                    theme: { color: string };
                };

                const options: RazorpayOptions = {
                    key: razorpayOrder.key,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    name: "ShopSpot",
                    description: "Order Payment",
                    order_id: razorpayOrder.orderId,
                    prefill: {
                        name: user?.name || "",
                        email: user?.email || "",
                        contact: shippingInfo?.phone || "",
                    },
                    handler: async (response: RazorpayHandlerResponse) => {
                        try {
                            const verifyRes = await verifyRazorpayPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id:
                                    response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }).unwrap();
                            if (verifyRes.success) {
                                await newOrder(orderData).unwrap();
                                dispatch(resetCart());
                                notify("Order placed successfully", "success");
                                navigate("/my-orders");
                            } else {
                                notify("Payment verification failed", "error");
                            }
                        } catch (err: unknown) {
                            const message = extractMessage(
                                err,
                                "Payment verification failed"
                            );
                            notify(message, "error");
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            setIsProcessing(false);
                            notify("Payment cancelled", "error");
                        },
                    },
                    payment_options: {
                        upi: true,
                    },
                    theme: { color: "#3b82f6" },
                };

                const rzp = new window.Razorpay(
                    options as unknown as Record<string, unknown>
                );
                rzp.open();
            } catch (error: unknown) {
                console.error(error);
                const message = extractMessage(
                    error,
                    "Payment initialization failed"
                );
                notify(message, "error");
                setIsProcessing(false);
            }
        }
    };

    return (
        <>
            <div className="checkout-container flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
                <div className="w-full max-w-lg mb-4">
                    <BackButton />
                </div>

                <form
                    onSubmit={submitHandler}
                    className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full"
                >
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-extrabold text-blue-900 tracking-wide">
                            ShopSpot
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Secure Checkout
                        </p>
                    </div>

                    <h2 className="text-xl font-semibold mb-2 text-gray-800">
                        Payment Details
                    </h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                        <p className="text-lg font-medium text-gray-700">
                            Total Amount:{" "}
                            <span className="text-blue-600 font-bold">
                                ₹ {total.toFixed(2)}
                            </span>
                        </p>
                    </div>

                    {/* Payment method selection */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Select Payment Method
                        </label>
                        <div className="flex gap-3">
                            <label className="flex items-center gap-2 border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-blue-500 w-1/2 transition-all">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="online"
                                    onChange={() => setPaymentMethod("online")}
                                    defaultChecked
                                    className="accent-blue-600"
                                />
                                <span className="font-medium text-gray-700">
                                    Online
                                </span>
                            </label>

                            <label className="flex items-center gap-2 border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-blue-500 w-1/2 transition-all">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="cod"
                                    onChange={() => setPaymentMethod("cod")}
                                    className="accent-blue-600"
                                />
                                <span className="font-medium text-gray-700">
                                    Cash on Delivery
                                </span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isProcessing || !user}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg w-full transition-all shadow-sm disabled:opacity-50"
                    >
                        {isProcessing
                            ? "Processing..."
                            : `Confirm & Pay ₹ ${total.toFixed(2)}`}
                    </button>
                </form>

                {showOtpPopup && (
                    <OtpPopup
                        phone={shippingInfo?.phone}
                        onClose={() => setShowOtpPopup(false)}
                        onVerified={async () => {
                            try {
                                await newOrder(orderData).unwrap();
                                dispatch(resetCart());
                                notify(
                                    "Order placed successfully (COD)",
                                    "success"
                                );
                                navigate("/my-orders");
                            } catch (err) {
                                const message = extractMessage(
                                    err,
                                    "Order placement failed"
                                );
                                notify(message, "error");
                            }
                        }}
                    />
                )}

                {/* <div className="text-center mt-6 text-gray-500 text-sm">
                    <p>
                        Powered by{" "}
                        <a
                            href="https://razorpay.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 font-semibold"
                        >
                            Razorpay
                        </a>
                    </p>
                </div> */}
            </div>
        </>
    );
};

// Define the Checkout component
const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const { total } = useSelector((state: RootState) => state.cart);
    const [loading] = useState<boolean>(false);

    useEffect(() => {
        if (!total || total <= 0) navigate("/cart");
    }, [total, navigate]);

    if (loading) {
        return <p>Loading...</p>;
    }

    return <CheckoutForm />;
};

export default Checkout;
