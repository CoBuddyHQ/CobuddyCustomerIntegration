import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { queryClient } from '../services/serverState/queryClient';
import { useServerQuery, UseServerQueryResult } from '../services/serverState/useServerQuery';

describe('useServerQuery key changes', () => {
  let latest: UseServerQueryResult<string> | undefined;
  const Probe = ({ queryKey, fetcher }: { queryKey: readonly unknown[]; fetcher: () => Promise<string> }) => {
    latest = useServerQuery(queryKey, fetcher, { staleTime: 60_000 });
    return null;
  };

  beforeEach(async () => {
    latest = undefined;
    await queryClient.clearAll();
  });

  it('hides prior-key data immediately and ignores a late response for the previous key', async () => {
    let resolveOld!: (value: string) => void;
    const oldFetcher = jest.fn(() => new Promise<string>((resolve) => { resolveOld = resolve; }));
    const newFetcher = jest.fn().mockResolvedValue('profile-b');
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<Probe queryKey={['profile', 'a']} fetcher={oldFetcher} />);
    });
    expect(latest?.isLoading).toBe(true);

    await act(async () => {
      renderer.update(<Probe queryKey={['profile', 'b']} fetcher={newFetcher} />);
      await Promise.resolve();
    });
    expect(latest?.data).toBe('profile-b');

    await act(async () => {
      resolveOld('profile-a');
      await Promise.resolve();
    });
    expect(latest?.data).toBe('profile-b');
    expect(queryClient.getQueryData(['profile', 'a'])).toBe('profile-a');
    expect(queryClient.getQueryData(['profile', 'b'])).toBe('profile-b');
    await act(async () => renderer.unmount());
  });
});
