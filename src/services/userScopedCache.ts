/** Small in-memory cache that keeps private data separated by authenticated user. */
export const createUserScopedCache = <T,>() => {
  const entries = new Map<string, T>();

  return {
    get(userKey: string): T | undefined {
      return entries.get(userKey);
    },
    set(userKey: string, value: T): void {
      entries.set(userKey, value);
    },
    delete(userKey: string): void {
      entries.delete(userKey);
    },
  };
};
