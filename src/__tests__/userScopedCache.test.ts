import { createUserScopedCache } from '../services/userScopedCache';

describe('createUserScopedCache', () => {
  it('keeps entries isolated between accounts', () => {
    const cache = createUserScopedCache<string[]>();
    cache.set('customer-a', ['A notification']);
    cache.set('customer-b', ['B notification']);

    expect(cache.get('customer-a')).toEqual(['A notification']);
    expect(cache.get('customer-b')).toEqual(['B notification']);
  });

  it('does not return data for an account without a cached entry', () => {
    const cache = createUserScopedCache<string[]>();
    cache.set('customer-a', ['A notification']);

    expect(cache.get('customer-c')).toBeUndefined();
  });
});
