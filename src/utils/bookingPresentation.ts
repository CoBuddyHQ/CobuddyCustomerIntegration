export type PaymentState = 'pending' | 'completed' | 'failed' | 'refunded' | 'unknown';

export const normalizePaymentState = (value: unknown): PaymentState => {
  if (typeof value !== 'string') return 'unknown';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'pending') return 'pending';
  if (normalized === 'completed' || normalized === 'paid') return 'completed';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'refunded') return 'refunded';
  return 'unknown';
};

export const isPaymentComplete = (value: unknown): boolean =>
  normalizePaymentState(value) === 'completed';

export const formatBookingAmount = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 'Unavailable';
  }
  return `₹${value.toLocaleString('en-IN')}`;
};
