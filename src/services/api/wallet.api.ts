/**
 * CoBuddy Customer — Wallet API Service
 * Maps to backend: src/modules/wallet/wallet.controller.ts
 */

import apiClient from './apiClient';

export interface WalletBalance {
  balance: number;
  currency: string;
  totalSpent?: number;
  totalAdded?: number;
  pendingAmount?: number;
  pendingRefund?: number;
  escrowHeld?: number;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'refund';
  category: string;
  label: string;
  amount: number;
  positive: boolean;
  status: 'Successful' | 'Pending' | 'Failed' | 'Refunded';
  date: string;
  time?: string;
  refId?: string;
  paymentSource?: string;
  companion?: string;
  duration?: string;
  breakdown?: Array<{ label: string; value: string }>;
  icon?: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentMethod {
  id: string;
  type: string;
  title: string;
  sub: string;
  icon: string;
  isVerified?: boolean;
  isDefault?: boolean;
}

export interface BankAccount {
  id: string;
  accName: string;
  accNumber: string;
  ifsc: string;
  isVerified?: boolean;
  isDefault?: boolean;
}

export interface WithdrawalMethod {
  id: string;
  type: string;
  title: string;
  sub?: string;
  icon?: string;
}

// ─── Get wallet balance ───────────────────────────────────────────────────────
export const getWalletBalance = async (): Promise<WalletBalance> => {
  const res = await apiClient.get<WalletBalance>('/wallet/balance');
  return res.data;
};

// ─── Get transactions ─────────────────────────────────────────────────────────
export const getTransactions = async (page = 1, limit = 20): Promise<TransactionsResponse> => {
  const res = await apiClient.get<TransactionsResponse>('/wallet/transactions', { params: { page, limit } });
  return res.data;
};

// ─── Get single transaction ────────────────────────────────────────────────────
export const getTransaction = async (id: string): Promise<Transaction> => {
  const res = await apiClient.get<Transaction>(`/wallet/transactions/${id}`);
  return res.data;
};

// ─── Get payment methods ──────────────────────────────────────────────────────
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const res = await apiClient.get<PaymentMethod[]>('/wallet/payment-methods');
  return res.data;
};

// ─── Add payment method ───────────────────────────────────────────────────────
export const addPaymentMethod = async (data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
  const res = await apiClient.post<PaymentMethod>('/wallet/payment-methods', data);
  return res.data;
};

// ─── Delete payment method ────────────────────────────────────────────────────
export const deletePaymentMethod = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.delete<{ message: string }>(`/wallet/payment-methods/${id}`);
  return res.data;
};

// ─── Get bank accounts ────────────────────────────────────────────────────────
export const getBankAccounts = async (): Promise<BankAccount[]> => {
  const res = await apiClient.get<BankAccount[]>('/wallet/bank-accounts');
  return res.data;
};

// ─── Add bank account ─────────────────────────────────────────────────────────
export const addBankAccount = async (data: { accName: string; accNumber: string; ifsc: string }): Promise<BankAccount> => {
  const res = await apiClient.post<BankAccount>('/wallet/bank-accounts', data);
  return res.data;
};

// ─── Delete bank account ──────────────────────────────────────────────────────
export const deleteBankAccount = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.delete<{ message: string }>(`/wallet/bank-accounts/${id}`);
  return res.data;
};

// ─── Get withdrawal methods ───────────────────────────────────────────────────
export const getWithdrawalMethods = async (): Promise<WithdrawalMethod[]> => {
  const res = await apiClient.get<WithdrawalMethod[]>('/wallet/withdrawal-methods');
  return res.data;
};

// ─── Withdraw money ───────────────────────────────────────────────────────────
export const withdrawMoney = async (amount: number, methodId?: string, type?: string): Promise<{ message: string; transaction?: Transaction }> => {
  const res = await apiClient.post<{ message: string; transaction?: Transaction }>('/wallet/withdraw', { amount, methodId, type });
  return res.data;
};
