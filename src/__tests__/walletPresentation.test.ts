import { isTransactionSettled, normalizeTransactionState } from '../utils/walletPresentation';

describe('wallet transaction presentation', () => {
  it('marks only server-reported settled states as settled', () => {
    expect(isTransactionSettled('Successful')).toBe(true);
    expect(isTransactionSettled('completed')).toBe(true);
    expect(isTransactionSettled('refunded')).toBe(true);
    expect(isTransactionSettled('pending')).toBe(false);
    expect(isTransactionSettled('failed')).toBe(false);
    expect(isTransactionSettled(undefined)).toBe(false);
  });

  it('keeps unrecognized transaction statuses in an unknown state', () => {
    expect(normalizeTransactionState('created')).toBe('unknown');
  });
});
