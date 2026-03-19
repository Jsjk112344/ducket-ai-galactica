// Ducket AI Galactica — Polling hook for /api/wallet
// Fetches WDK wallet info every 10 seconds and provides loading state.
// Apache 2.0 License

import { useState, useEffect } from 'react';
import { WalletInfo } from '../types';

export interface UseWalletResult {
  wallet: WalletInfo | null;
  loading: boolean;
}

export function useWallet(): UseWalletResult {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await window.fetch('/api/wallet');
        const data: WalletInfo = await res.json();
        setWallet(data);
      } catch {
        // Network error — keep last known state
      } finally {
        setLoading(false);
      }
    }

    // Fetch immediately on mount
    fetchWallet();

    // Then poll every 10 seconds
    const id = setInterval(fetchWallet, 10_000);
    return () => clearInterval(id);
  }, []);

  return { wallet, loading };
}
