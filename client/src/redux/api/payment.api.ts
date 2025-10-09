import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface CreateRazorpayOrderRequest { amount: number; }
export interface CreateRazorpayOrderResponse { success: boolean; key: string; orderId: string; amount: number; currency: string; }
export interface VerifyRazorpayPaymentRequest { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }
export interface VerifyRazorpayPaymentResponse { success: boolean; }

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `/api/v1/payments`,
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    createRazorpayOrder: builder.mutation<CreateRazorpayOrderResponse, CreateRazorpayOrderRequest>({
      query: (payload) => ({ url: 'order', method: 'POST', body: payload }),
    }),
    verifyRazorpayPayment: builder.mutation<VerifyRazorpayPaymentResponse, VerifyRazorpayPaymentRequest>({
      query: (payload) => ({ url: 'verify', method: 'POST', body: payload }),
    })
  }),
});

export const {
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} = paymentApi;
