// Ducket AI Galactica — Polling hook for /api/listings
// Fetches scanned listings every 10 seconds and provides loading state.
// Apache 2.0 License

import { useState, useEffect } from 'react';
import { Listing } from '../types';

export interface UseListingsResult {
  listings: Listing[];
  lastUpdated: Date | null;
  loading: boolean;
}

export function useListings(): UseListingsResult {
  const [listings, setListings] = useState<Listing[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await window.fetch('/api/listings');
        const data: Listing[] = await res.json();
        setListings(data);
        setLastUpdated(new Date());
      } catch {
        // Network error — keep last known state
      } finally {
        setLoading(false);
      }
    }

    // Fetch immediately on mount
    fetchListings();

    // Then poll every 10 seconds
    const id = setInterval(fetchListings, 10_000);
    return () => clearInterval(id);
  }, []);

  return { listings, lastUpdated, loading };
}
