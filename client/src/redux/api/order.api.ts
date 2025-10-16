import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
    AllOrdersResponse,
    MessageResponse,
    NewOrderRequest,
    OrderDetailsResponse,
    UpdateOrderPaymentRequest,
    UpdateOrderRequest,
} from "../../types/api-types";

export const orderApi = createApi({
    reducerPath: "orderApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `/api/v1/orders/`,
        credentials: "include",
    }),
    tagTypes: ["orders"],
    endpoints: (builder) => ({
        newOrder: builder.mutation<MessageResponse, NewOrderRequest>({
            query: (order) => ({
                url: `new`,
                method: "POST",
                body: order,
            }),
            invalidatesTags: ["orders"],
        }),
        myOrders: builder.query<
            AllOrdersResponse,
            { page: number; limit: number }
        >({
            query: ({ page, limit }) => `my?page=${page}&limit=${limit}`,
            providesTags: ["orders"],
        }),
        allOrders: builder.query<
            AllOrdersResponse,
            { page: number; limit: number }
        >({
            query: ({ page, limit }) => `all?page=${page}&limit=${limit}`,
            providesTags: ["orders"],
        }),
        orderDetails: builder.query<OrderDetailsResponse, string>({
            query: (id) => id,
            providesTags: ["orders"],
        }),
        deleteOrder: builder.mutation<MessageResponse, string>({
            query: (id) => ({
                url: `delete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["orders"],
        }),
        updateOrderStatus: builder.mutation<
            MessageResponse,
            UpdateOrderRequest
        >({
            query: (order) => ({
                url: `update-status`,
                method: "PUT",
                body: order,
            }),
            invalidatesTags: ["orders"],
        }),
        updatePaymentStatus: builder.mutation<
            MessageResponse,
            UpdateOrderPaymentRequest
        >({
            query: ({orderId, ...order}) => ({
                url: `payment-status/${orderId}`,
                method: "PUT",
                body: order,
            }),

            invalidatesTags: ["orders"],
        }),
    }),
});

export const {
    useNewOrderMutation,
    useAllOrdersQuery,
    useMyOrdersQuery,
    useOrderDetailsQuery,
    useDeleteOrderMutation,
    useUpdateOrderStatusMutation,
    useUpdatePaymentStatusMutation,
} = orderApi; // This is a placeholder to avoid TS error
