/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../components/common/BackBtn";
import {
    useDeleteOrderMutation,
    useOrderDetailsQuery,
    useUpdateOrderStatusMutation,
    useUpdatePaymentStatusMutation,
} from "../../redux/api/order.api";
import { notify } from "../../utils/util";
import Loader from "../../components/common/Loader";
import ConfirmPopup from "../../components/common/ConfirmPopup";

const AdminOrderDetails: React.FC = () => {
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string }>();
    const { data, isLoading, isError, refetch } = useOrderDetailsQuery(
        orderId!
    );
    const [updateOrderStatus] = useUpdateOrderStatusMutation();
    const [updateOrderPaymentStatus] = useUpdatePaymentStatusMutation();
    const [deleteOrder] = useDeleteOrderMutation();

    // Popup control states
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupAction, setPopupAction] = useState<
        "delete" | "updateStatus" | "updatePayment" | null
    >(null);
    const [pendingValue, setPendingValue] = useState<any>(null);

    const confirmAction = (
        type: "delete" | "updateStatus" | "updatePayment",
        value?: any
    ) => {
        setPopupAction(type);
        setPendingValue(value);
        setShowPopup(true);
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            if (popupAction === "delete") {
                await deleteOrder(orderId!).unwrap();
                notify("Order deleted successfully", "success");
                navigate("/admin/orders");
            } else if (popupAction === "updateStatus") {
                await updateOrderStatus({
                    orderId: orderId!,
                    status: pendingValue,
                }).unwrap();
                notify("Order status updated successfully", "success");
                refetch();
            } else if (popupAction === "updatePayment") {
                await updateOrderPaymentStatus({
                    orderId: orderId!,
                    paymentStatus: pendingValue,
                }).unwrap();
                notify("Payment status updated successfully", "success");
                refetch();
            }
        } catch (error) {
            notify("Action failed", "error");
        } finally {
            setShowPopup(false);
            setPopupAction(null);
            setPendingValue(null);
            setLoading(false);
        }
    };

    // const handleStatusUpdate = async (status: string) => {
    //     try {
    //         await updateOrderStatus({ orderId: orderId!, status }).unwrap();
    //         notify("Order status updated successfully", "success");
    //         refetch();
    //     } catch (error) {
    //         notify("Failed to update order status", "error");
    //     }
    // };
    // const handlePaymentStatusUpdate = async (
    //     orderId: string,
    //     paymentStatus: "Pending" | "Paid" | "Failed"
    // ) => {
    //     try {
    //         await updateOrderPaymentStatus({
    //             orderId: orderId!,
    //             paymentStatus,
    //         }).unwrap();
    //         notify("Order payment status updated successfully", "success");
    //         refetch();
    //     } catch (error) {
    //         notify("Failed to update order payment status", "error");
    //     }
    // };

    // const handleDeleteOrder = async () => {
    //     try {
    //         await deleteOrder(orderId!).unwrap();
    //         notify("Order deleted successfully", "success");
    //         navigate("/admin/orders");
    //     } catch (error) {
    //         notify("Failed to delete order", "error");
    //     }
    // };

    if (isError) return <p>Error loading order details: </p>;
    if (isLoading) return <Loader />;

    return (
        <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
            <BackButton />
            <h1 className="text-3xl font-bold mb-6">Order Details</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-4">
                    Order #{data?.order?._id}
                </h2>
                <p className="mb-4">
                    <strong>Customer:</strong> {data?.order?.user.name}
                </p>
                <p className="mb-4">
                    <strong>Amount:</strong> ₹ {data?.order?.total}
                </p>
                <p className="mb-4">
                    <strong>Payment Method:</strong> {data?.order?.paymentMethod}
                </p>
                <p className="mb-4">
                    <strong>Status:</strong> {data?.order?.status}
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-2">Order Items</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="py-3 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="py-3 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="py-3 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.order.orderItems.map((item) => (
                                <tr
                                    key={item.productId}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="py-3 px-4 border-b border-gray-300 text-sm">
                                        {item.name}
                                    </td>
                                    <td className="py-3 px-4 border-b border-gray-300 text-sm">
                                        {item.quantity}
                                    </td>
                                    <td className="py-3 px-4 border-b border-gray-300 text-sm">
                                        ₹ {item.price}
                                    </td>
                                    <td className="py-3 px-4 border-b border-gray-300 text-sm">
                                        ₹ {item.quantity * item.price}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex gap-6">
                        <div className="flex items-center space-x-4">
                            <label className="text-sm font-medium">
                                Update Delivery Status:
                            </label>
                            <select
                                className="p-2 border rounded-md"
                                value={data?.order?.status}
                                onChange={(e) =>
                                    confirmAction(
                                        "updateStatus",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="text-sm font-medium">
                                Update Payment Status:
                            </label>
                            <select
                                className="p-2 border rounded-md"
                                value={data?.order?.paymentStatus}
                                onChange={(e) => {
                                    confirmAction(
                                        "updatePayment",
                                        e.target.value
                                    );
                                }}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                                <option value="Failed">Failed</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={() =>
                            confirmAction("delete", data?.order?._id)
                        }
                        className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 transition duration-300"
                    >
                        Delete Order
                    </button>
                </div>
            </div>

            <ConfirmPopup
                isOpen={showPopup}
                title={
                    popupAction === "delete"
                        ? "Are you sure you want to delete this order?"
                        : "Are you sure you want to update this order?"
                }
                message={
                    popupAction === "delete"
                        ? "This action cannot be undone."
                        : "Confirm your change to proceed."
                }
                onConfirm={handleConfirm}
                onCancel={() => setShowPopup(false)}
                loading={loading}
            />
        </div>
    );
};

export default AdminOrderDetails;
