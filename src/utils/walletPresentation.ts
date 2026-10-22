export type TransactionState = 'settled' | 'pending' | 'failed' | 'unknown';

export const normalizeTransactionState = (value: unknown): TransactionState => {
  if (typeof value !== 'string') return 'unknown';
  const normalized = value.trim().toLowerCase();
  if (['successful', 'completed', 'refunded'].includes(normalized)) return 'settled';
  if (normalized === 'pending' || normalized === 'processing') return 'pending';
  if (normalized === 'failed' || normalized === 'cancelled') return 'failed';
  return 'unknown';
};

export const isTransactionSettled = (value: unknown): boolean =>
  normalizeTransactionState(value) === 'settled';
