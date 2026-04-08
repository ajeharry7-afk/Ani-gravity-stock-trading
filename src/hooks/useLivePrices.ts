import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

const POLL_INTERVAL_MS = 10_000; // 10 seconds — Finnhub free tier allows 60 req/min

export function useLivePrices() {
  const updatePrice = useAuthStore(state => state.updateMarketAndHoldingPrice);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchPrices = async () => {
      const listings = useAuthStore.getState().marketListings;
      const symbols = listings.map(l => l.symbol).join(',');
      if (!symbols) return;

      try {
        const res = await fetch(`/api/live-prices?symbols=${encodeURIComponent(symbols)}`);
        if (!res.ok) return;
        const prices: { symbol: string; price: number }[] = await res.json();
        prices.forEach(({ symbol, price }) => updatePrice(symbol, price));
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error('Price fetch error:', err);
      }
    };

    fetchPrices(); // immediate first fetch
    intervalRef.current = setInterval(fetchPrices, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, updatePrice]);
}
