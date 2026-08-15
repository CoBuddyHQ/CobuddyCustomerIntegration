/**
 * CoBuddy Customer — Payment API Service
 * Maps to backend: src/modules/payment/payment.controller.ts
 * (Razorpay integration)
 */

import apiClient from './apiClient';

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  description?: string;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bookingId?: string;
}

export interface WalletTopupOrder extends RazorpayOrder {
  description?: string;
}

export interface WalletTopupVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount?: number;
}

// ─── Create booking payment order ─────────────────────────────────────────────
export const createBookingOrder = async (bookingId: string): Promise<RazorpayOrder> => {
  const res = await apiClient.post<RazorpayOrder>('/payments/create-order', { bookingId });
  return res.data;
};

// ─── Verify booking payment ────────────────────────────────────────────────────
export const verifyBookingPayment = async (data: PaymentVerificationData): Promise<{ message: string; success: boolean }> => {
  const res = await apiClient.post<{ message: string; success: boolean }>('/payments/verify', data);
  return res.data;
};

// ─── Get order status ─────────────────────────────────────────────────────────
export const getOrderStatus = async (orderId: string): Promise<{ status: string; orderId: string }> => {
  const res = await apiClient.get<{ status: string; orderId: string }>(`/payments/order/${orderId}`);
  return res.data;
};

// ─── Create wallet top-up order ───────────────────────────────────────────────
export const createWalletTopupOrder = async (amount: number, description?: string): Promise<WalletTopupOrder> => {
  const res = await apiClient.post<WalletTopupOrder>('/payments/add-money/create-order', { amount, description });
  return res.data;
};

// ─── Verify wallet top-up payment ─────────────────────────────────────────────
export const verifyWalletTopup = async (data: WalletTopupVerificationData): Promise<{ message: string; balance?: number }> => {
  const res = await apiClient.post<{ message: string; balance?: number }>('/payments/add-money/verify', data);
  return res.data;
};
