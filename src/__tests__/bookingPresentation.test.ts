import {
  formatBookingAmount,
  isPaymentComplete,
  normalizePaymentState,
} from '../utils/bookingPresentation';

describe('booking presentation uses only server supplied payment values', () => {
  it('formats a numeric amount and does not invent one for missing or invalid data', () => {
    expect(formatBookingAmount(12500)).toBe('₹12,500');
    expect(formatBookingAmount(undefined)).toBe('Unavailable');
    expect(formatBookingAmount(Number.NaN)).toBe('Unavailable');
    expect(formatBookingAmount(-1)).toBe('Unavailable');
  });

  it('marks only an explicit completed or paid server state as complete', () => {
    expect(isPaymentComplete('completed')).toBe(true);
    expect(isPaymentComplete('paid')).toBe(true);
    expect(isPaymentComplete('pending')).toBe(false);
    expect(isPaymentComplete(undefined)).toBe(false);
  });

  it('normalizes only recognized payment states', () => {
    expect(normalizePaymentState('REFUNDED')).toBe('refunded');
    expect(normalizePaymentState('processing')).toBe('unknown');
  });
});
