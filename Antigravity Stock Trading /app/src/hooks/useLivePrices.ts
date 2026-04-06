import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useLivePrices() {
  const updatePrice = useAuthStore(state => state.updateMarketAndHoldingPrice);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only connect if the user is authenticated to avoid unnecessary bandwidth when logged out
    if (!isAuthenticated) return;

    // Vite exposes env variables through import.meta.env
    const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
    if (!apiKey) {
      console.warn('VITE_FINNHUB_API_KEY is missing in your .env file. Real-time prices will not update.');
      return;
    }

    const ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connected to Finnhub WebSocket Live Market Data');
      
      // We read the listings straight from the store without tracking it as a reactive dependency.
      // If we tracked it, the WebSocket would forcefully close and reconnect every single time a price changed!
      const listings = useAuthStore.getState().marketListings;
      
      listings.forEach(listing => {
        // Subscribe to all standard US stocks. 
        ws.send(JSON.stringify({ type: 'subscribe', symbol: listing.symbol }));
      });
    };

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        
        // Finnhub trade event payload pushes { type: 'trade', data: [{ p: price, s: symbol, v: volume }] }
        if (response.type === 'trade' && Array.isArray(response.data)) {
          response.data.forEach((trade: any) => {
            if (trade.s && typeof trade.p === 'number') {
              // Push the live price instantly into our Zustand global state,
              // which automatically renders the new price everywhere on the screen instantaneously!
              updatePrice(trade.s, trade.p);
            }
          });
        }
      } catch (err) {
        // Silently ignore parse errors so we don't spam the console if Finnhub sends ping metadata
      }
    };

    ws.onerror = (error) => {
      console.error('Finnhub WebSocket Error:', error);
    };

    ws.onclose = () => {
      console.log('🔄 Disconnected from Finnhub WebSocket');
    };

    return () => {
      // Cleanup the connection when the user logs out or leaves the page
      if (ws.readyState === WebSocket.OPEN) {
        const listings = useAuthStore.getState().marketListings;
        listings.forEach(listing => {
          ws.send(JSON.stringify({ type: 'unsubscribe', symbol: listing.symbol }));
        });
        ws.close();
      }
    };
  }, [isAuthenticated, updatePrice]);
}
