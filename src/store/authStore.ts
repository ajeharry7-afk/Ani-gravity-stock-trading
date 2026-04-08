import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, StockHolding, Portfolio, MarketListing, PendingPurchase, PaymentMethod, AppNotification } from '@/types';

const syncUserToSupabase = async (email: string, userData: any) => {
  try {
    await fetch(`/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, email: email.toLowerCase() })
    });
  } catch (error) {
    console.warn('Failed to sync user to Supabase:', error);
  }
};


interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  holdings: StockHolding[];
  marketListings: MarketListing[];
  pendingPurchase: PendingPurchase | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  requestLoginOTP: (email: string, password: string, rememberMe?: boolean) => Promise<string | null>;
  verifyLoginOTP: (email: string, otp: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  requestSignupOTP: (email: string, password: string, name: string, kycData?: any) => Promise<boolean>;
  verifySignupOTP: (email: string, otp: string) => Promise<boolean>;
  logout: () => void;
  addHolding: (holding: Omit<StockHolding, 'id'>) => void;
  removeHolding: (id: string) => void;
  updateHoldingPrice: (symbol: string, newPrice: number) => void;
  getPortfolio: () => Portfolio;
  setPendingPurchase: (purchase: PendingPurchase | null) => void;
  executePurchase: (symbol: string, shares: number, ownershipType: 'individual' | 'joint', jointHolderName?: string) => boolean;
  completePurchaseWithPayment: (paymentMethod: PaymentMethod) => Promise<{ success: boolean; message: string }>;
  sendOwnerNotification: (purchase: PendingPurchase, paymentMethod: PaymentMethod, userEmail: string) => Promise<void>;
  notifications: AppNotification[];
  registeredUsers: { [email: string]: { password: string; user: User } };
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'read'>) => void;
  markNotificationsAsRead: () => void;
  updateMarketAndHoldingPrice: (symbol: string, newPrice: number) => void;
  updateUser: (updates: Partial<User>) => void;
  updatePassword: (newPass: string) => void;
  toggle2FA: () => void;
  sendSignupNotification: (name: string, email: string, kycData?: any) => Promise<void>;
}

// Market listings - stocks available for purchase
const marketListingsData: MarketListing[] = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    currentPrice: 255.92,
    previousClose: 253.50,
    change: 2.42,
    changePercent: 0.95,
    volume: 45611140,
    marketCap: 3761492983808,
    dayHigh: 256.13,
    dayLow: 250.65,
    sharesAvailable: 10000,
    sector: 'Technology',
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla, Inc.',
    currentPrice: 360.59,
    previousClose: 381.26,
    change: -20.67,
    changePercent: -5.42,
    volume: 82532959,
    marketCap: 1353089417216,
    dayHigh: 370.26,
    dayLow: 359.03,
    sharesAvailable: 5000,
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    currentPrice: 177.39,
    previousClose: 175.75,
    change: 1.64,
    changePercent: 0.93,
    volume: 141415327,
    marketCap: 4311464017920,
    dayHigh: 177.48,
    dayLow: 171.37,
    sharesAvailable: 8000,
    sector: 'Technology',
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    currentPrice: 425.50,
    previousClose: 422.00,
    change: 3.50,
    changePercent: 0.83,
    volume: 23456789,
    marketCap: 3150000000000,
    dayHigh: 428.00,
    dayLow: 420.50,
    sharesAvailable: 6000,
    sector: 'Technology',
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon.com Inc.',
    currentPrice: 198.75,
    previousClose: 196.20,
    change: 2.55,
    changePercent: 1.30,
    volume: 34567890,
    marketCap: 2050000000000,
    dayHigh: 200.00,
    dayLow: 195.50,
    sharesAvailable: 7500,
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    currentPrice: 175.20,
    previousClose: 173.80,
    change: 1.40,
    changePercent: 0.81,
    volume: 18923456,
    marketCap: 2180000000000,
    dayHigh: 176.50,
    dayLow: 172.90,
    sharesAvailable: 9000,
    sector: 'Communication Services',
  },
  {
    symbol: 'META',
    companyName: 'Meta Platforms Inc.',
    currentPrice: 595.30,
    previousClose: 590.00,
    change: 5.30,
    changePercent: 0.90,
    volume: 12345678,
    marketCap: 1520000000000,
    dayHigh: 598.00,
    dayLow: 588.50,
    sharesAvailable: 4000,
    sector: 'Communication Services',
  },
  {
    symbol: 'NFLX',
    companyName: 'Netflix Inc.',
    currentPrice: 885.50,
    previousClose: 875.00,
    change: 10.50,
    changePercent: 1.20,
    volume: 5678901,
    marketCap: 385000000000,
    dayHigh: 890.00,
    dayLow: 872.00,
    sharesAvailable: 3000,
    sector: 'Communication Services',
  },
  {
    symbol: 'AMD',
    companyName: 'Advanced Micro Devices',
    currentPrice: 102.45,
    previousClose: 100.20,
    change: 2.25,
    changePercent: 2.25,
    volume: 45678901,
    marketCap: 165000000000,
    dayHigh: 103.00,
    dayLow: 99.50,
    sharesAvailable: 12000,
    sector: 'Technology',
  },
  {
    symbol: 'INTC',
    companyName: 'Intel Corporation',
    currentPrice: 22.15,
    previousClose: 22.50,
    change: -0.35,
    changePercent: -1.56,
    volume: 67890123,
    marketCap: 95000000000,
    dayHigh: 22.80,
    dayLow: 21.90,
    sharesAvailable: 25000,
    sector: 'Technology',
  },
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    currentPrice: 245.80,
    previousClose: 243.50,
    change: 2.30,
    changePercent: 0.94,
    volume: 9876543,
    marketCap: 705000000000,
    dayHigh: 247.00,
    dayLow: 242.00,
    sharesAvailable: 5500,
    sector: 'Financial Services',
  },
  {
    symbol: 'V',
    companyName: 'Visa Inc.',
    currentPrice: 315.40,
    previousClose: 312.00,
    change: 3.40,
    changePercent: 1.09,
    volume: 4567890,
    marketCap: 645000000000,
    dayHigh: 317.00,
    dayLow: 311.00,
    sharesAvailable: 4500,
    sector: 'Financial Services',
  },
  {
    symbol: 'SPCX',
    companyName: 'SpaceX',
    currentPrice: 940.50,
    previousClose: 935.00,
    change: 5.50,
    changePercent: 0.58,
    volume: 1200300,
    marketCap: 210000000000,
    dayHigh: 950.00,
    dayLow: 930.00,
    sharesAvailable: 2500,
    sector: 'Aerospace',
  },
  {
    symbol: 'PLTR',
    companyName: 'Palantir Technologies Inc.',
    currentPrice: 24.50,
    previousClose: 22.80,
    change: 1.70,
    changePercent: 7.45,
    volume: 65432100,
    marketCap: 52000000000,
    dayHigh: 25.10,
    dayLow: 23.90,
    sharesAvailable: 15000,
    sector: 'Technology',
  },
  {
    symbol: 'RIVN',
    companyName: 'Rivian Automotive, Inc.',
    currentPrice: 15.20,
    previousClose: 16.00,
    change: -0.80,
    changePercent: -5.00,
    volume: 34567800,
    marketCap: 15000000000,
    dayHigh: 16.10,
    dayLow: 14.80,
    sharesAvailable: 12000,
    sector: 'Automotive',
  },
];

// OTP generation and verification are handled server-side via /api/auth/* routes.

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      holdings: [],
      marketListings: marketListingsData,
      pendingPurchase: null,
      notifications: [],
      registeredUsers: {},

      updateUser: (updates) => {
        set((state) => {
          if (!state.user) return state;
          
          const oldEmail = state.user.email.toLowerCase();
          const newEmail = updates.email ? updates.email.toLowerCase() : oldEmail;
          
          const newUser = { ...state.user, ...updates };
          const newRegisteredUsers = { ...state.registeredUsers };
          
          if (oldEmail !== newEmail) {
            const oldCredentials = newRegisteredUsers[oldEmail];
            if (oldCredentials) {
                newRegisteredUsers[newEmail] = { ...oldCredentials, user: newUser };
                delete newRegisteredUsers[oldEmail];
            }
          } else if (newRegisteredUsers[newEmail]) {
            newRegisteredUsers[newEmail] = { ...newRegisteredUsers[newEmail], user: newUser };
          }
          
          if (newRegisteredUsers[newEmail]) {
            syncUserToSupabase(newEmail, newRegisteredUsers[newEmail]);
          }
          
          return {
            user: newUser,
            registeredUsers: newRegisteredUsers
          };
        });
      },

      updatePassword: (newPass) => {
        set((state) => {
          if (!state.user) return state;
          const emailLower = state.user.email.toLowerCase();
          if (state.registeredUsers[emailLower]) {
            const updatedUsers = {
              ...state.registeredUsers,
              [emailLower]: { ...state.registeredUsers[emailLower], password: newPass }
            };
            syncUserToSupabase(emailLower, updatedUsers[emailLower]);
            return { registeredUsers: updatedUsers };
          }
          return state;
        });
      },

      toggle2FA: () => {
        set((state) => {
          if (!state.user) return state;
          const newStatus = !state.user.twoFactorEnabled;
          const newUser = { ...state.user, twoFactorEnabled: newStatus };
          
          const emailLower = state.user.email.toLowerCase();
          const newRegisteredUsers = { ...state.registeredUsers };
          if (newRegisteredUsers[emailLower]) {
              newRegisteredUsers[emailLower].user = newUser;
              syncUserToSupabase(emailLower, newRegisteredUsers[emailLower]);
          }
          
          return { user: newUser, registeredUsers: newRegisteredUsers };
        });
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).substr(2, 9),
              date: new Date(),
              read: false,
            },
            ...state.notifications,
          ],
        }));
      },

      markNotificationsAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      login: async (email: string, password: string, _rememberMe?: boolean) => {
        // Keep login method for backward compatibility or simple login bypass in UI
        const emailLower = email.toLowerCase();
        
        const storedUser = get().registeredUsers[emailLower];
        if (storedUser && storedUser.password === password) {
          set({
            user: storedUser.user,
            isAuthenticated: true,
            holdings: []
          });
          return true;
        }
        return false;
      },

      requestLoginOTP: async (email: string, password: string, _rememberMe?: boolean) => {
        const emailLower = email.toLowerCase();
        try {
          const res = await fetch('/api/auth/request-login-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailLower, password }),
          });
          const data = await res.json();
          if (!res.ok) return data.error || 'Login failed. Please try again.';
          return null; // null = success
        } catch {
          return 'Network error. Please check your connection.';
        }
      },

      verifyLoginOTP: async (email: string, otp: string) => {
        const emailLower = email.toLowerCase();
        try {
          const res = await fetch('/api/auth/verify-login-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailLower, otp }),
          });
          if (!res.ok) return false;

          const { user, holdings: rawHoldings } = await res.json();

          const holdings: StockHolding[] = (rawHoldings ?? []).map((h: any) => ({
            ...h,
            purchaseDate: new Date(h.purchaseDate),
          }));

          set((state) => ({
            user,
            isAuthenticated: true,
            holdings,
            registeredUsers: { ...state.registeredUsers, [emailLower]: { password: '', user } },
          }));

          // Fetch server-side notifications (e.g. admin balance updates)
          try {
            const notifRes = await fetch(`/api/notifications?email=${encodeURIComponent(emailLower)}`);
            if (notifRes.ok) {
              const serverNotifs = await notifRes.json();
              const mapped = serverNotifs.map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type as 'success' | 'info' | 'warning',
                date: new Date(n.created_at),
                read: false,
              }));
              if (mapped.length > 0) {
                set((state) => ({ notifications: [...mapped, ...state.notifications] }));
              }
            }
          } catch {
            // non-critical
          }

          get().addNotification({
            title: 'Welcome Back!',
            message: `Successfully logged in as ${user.name}.`,
            type: 'success',
          });

          // Apply admin-set market price overrides
          try {
            const priceRes = await fetch('/api/market-prices');
            if (priceRes.ok) {
              const overrides = await priceRes.json();
              overrides.forEach((o: { symbol: string; price: number }) => {
                get().updateMarketAndHoldingPrice(o.symbol, o.price);
              });
            }
          } catch {
            // non-critical
          }

          return true;
        } catch {
          return false;
        }
      },

      signup: async (email: string, password: string, name: string) => {
        // Legacy — kept for backward compatibility; real signup uses requestSignupOTP
        const emailLower = email.toLowerCase();
        if (get().registeredUsers[emailLower]) return false;
        const newUser: User = { id: emailLower, email: emailLower, name, createdAt: new Date() };
        set((state) => ({
          registeredUsers: { ...state.registeredUsers, [emailLower]: { password, user: newUser } },
          user: newUser,
          isAuthenticated: true,
          holdings: [],
        }));
        return true;
      },

      requestSignupOTP: async (email: string, password: string, name: string, kycData: any = null) => {
        const emailLower = email.toLowerCase();
        try {
          const res = await fetch('/api/auth/request-signup-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailLower, password, name, kycData }),
          });
          if (res.status === 409) return false; // email already taken
          return res.ok;
        } catch {
          return false;
        }
      },

      verifySignupOTP: async (email: string, otp: string) => {
        const emailLower = email.toLowerCase();
        try {
          const res = await fetch('/api/auth/verify-signup-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailLower, otp }),
          });
          if (!res.ok) return false;

          const { user } = await res.json();

          set((state) => ({
            registeredUsers: { ...state.registeredUsers, [emailLower]: { password: '', user } },
            user,
            isAuthenticated: true,
            holdings: [],
          }));

          get().addNotification({
            title: 'Account Created',
            message: 'Welcome to Antigravity! Your smart portfolio is ready.',
            type: 'success',
          });

          get().sendSignupNotification(user.name, emailLower);
          return true;
        } catch {
          return false;
        }
      },

      sendSignupNotification: async (name: string, email: string, kycData: any = null) => {
        try {
          const response = await fetch(`/api/notify-signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, kycData }),
          });

          if (response.ok) {
            console.log(`✅ Admin signup notification sent successfully!`);
          } else {
            console.warn(`⚠️ Signup notification error:`, await response.text());
          }
        } catch (error) {
          console.warn(`Signup notification failed:`, error);
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, holdings: [], pendingPurchase: null });
      },

      setPendingPurchase: (purchase) => {
        set({ pendingPurchase: purchase });
      },

      executePurchase: (symbol: string, shares: number, ownershipType: 'individual' | 'joint', jointHolderName?: string) => {
        const { marketListings, holdings } = get();
        const listing = marketListings.find(l => l.symbol === symbol);
        
        if (!listing) {
          return false;
        }
        
        if (listing.sharesAvailable < shares) {
          return false;
        }
        
        const existingHolding = holdings.find(h => h.symbol === symbol && h.ownershipType === ownershipType);
        
        if (existingHolding) {
          const totalShares = existingHolding.shares + shares;
          const totalCost = (existingHolding.shares * existingHolding.purchasePrice) + (shares * listing.currentPrice);
          const newAvgPrice = totalCost / totalShares;
          
          set((state) => ({
            holdings: state.holdings.map(h => 
              h.id === existingHolding.id 
                ? { ...h, shares: totalShares, purchasePrice: newAvgPrice }
                : h
            ),
            marketListings: state.marketListings.map(l =>
              l.symbol === symbol
                ? { ...l, sharesAvailable: l.sharesAvailable - shares }
                : l
            ),
          }));
        } else {
          const newHolding: StockHolding = {
            id: crypto.randomUUID(),
            symbol: listing.symbol,
            companyName: listing.companyName,
            shares: shares,
            purchasePrice: listing.currentPrice,
            currentPrice: listing.currentPrice,
            ownershipType: ownershipType,
            jointHolderName: jointHolderName,
            purchaseDate: new Date(),
            status: 'processing',
          };
          
          set((state) => ({
            holdings: [...state.holdings, newHolding],
            marketListings: state.marketListings.map(l =>
              l.symbol === symbol
                ? { ...l, sharesAvailable: l.sharesAvailable - shares }
                : l
            ),
          }));
        }
        
        return true;
      },

      sendOwnerNotification: async (purchase: PendingPurchase, paymentMethod: PaymentMethod, userEmail: string) => {
        try {
          const response = await fetch(`/api/notify-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail, purchase, paymentMethod }),
          });

          if (response.ok) {
            console.log(`✅ Admin notification email sent successfully!`);
            alert(`We have received your payment request and will email you the payment details, your portfolio will be updated as soon as your payment is confirmed.`);
          } else {
            console.warn(`⚠️ The local server returned an error:`, await response.text());
          }
        } catch (error) {
          console.warn(`🕒 Local server not running yet on port 3001. Fallback to local console log.`);
          
          console.log('\n=== LOCAL MOCK: EMAIL TO APP OWNER ===');
          console.log(`To: admin@antigravity-trading.com`);
          console.log(`Subject: New Stock Purchase Order - ${purchase.symbol}`);
          console.log(`User: ${userEmail}`);
          console.log(`Stock: ${purchase.symbol} (${purchase.companyName})`);
          console.log(`Shares: ${purchase.shares}`);
          console.log(`Total amount: $${purchase.totalCost.toFixed(2)}`);
          console.log('========================================\n');
        }
      },

      completePurchaseWithPayment: async (paymentMethod: PaymentMethod) => {
        const { pendingPurchase, user, executePurchase, sendOwnerNotification } = get();
        
        if (!pendingPurchase) {
          return { success: false, message: 'No pending purchase found' };
        }
        
        if (!user) {
          return { success: false, message: 'User not authenticated' };
        }
        
        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Complete the stock purchase
        const success = executePurchase(
          pendingPurchase.symbol,
          pendingPurchase.shares,
          pendingPurchase.ownershipType,
          pendingPurchase.jointHolderName
        );
        
        if (success) {
          // Sync purchase directly to Firebase so Admin Command Center updates instantly
          syncUserToSupabase(user.email, { 
            ...get().registeredUsers[user.email.toLowerCase()],
            holdings: get().holdings,
            latestInteraction: new Date().toISOString()
          });

          // Send email notification to owner
          await sendOwnerNotification(pendingPurchase, paymentMethod, user.email);
          
          get().addNotification({
            title: 'Order Processing',
            message: `Your purchase of ${pendingPurchase.shares} shares of ${pendingPurchase.symbol} is currently processing.`,
            type: 'info',
          });
          
          // Clear pending purchase
          set({ pendingPurchase: null });
          
          const paymentMethodLabels: Record<PaymentMethod, string> = {
            wire: 'Wire Transfer',
            ach: 'ACH Payment',
            credit_card: 'Credit Card',
            crypto: 'Cryptocurrency'
          };
          
          return { 
            success: true, 
            message: `Purchase completed successfully using ${paymentMethodLabels[paymentMethod]}. The app owner has been notified.` 
          };
        }
        
        return { success: false, message: 'Failed to complete purchase' };
      },

      addHolding: (holding) => {
        const newHolding: StockHolding = {
          ...holding,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          holdings: [...state.holdings, newHolding],
        }));
      },

      removeHolding: (id) => {
        set((state) => ({
          holdings: state.holdings.filter((h) => h.id !== id),
        }));
      },

      updateHoldingPrice: (symbol, newPrice) => {
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.symbol === symbol ? { ...h, currentPrice: newPrice } : h
          ),
        }));
      },

      updateMarketAndHoldingPrice: (symbol, newPrice) => {
        set((state) => {
          const updatedListings = state.marketListings.map(l => {
            if (l.symbol === symbol) {
              const change = newPrice - l.previousClose;
              const changePercent = (change / l.previousClose) * 100;
              // Make sure to cleanly round to 2 decimal places to avoid floating point issues
              return { 
                ...l, 
                currentPrice: Number(newPrice.toFixed(2)), 
                change: Number(change.toFixed(2)), 
                changePercent: Number(changePercent.toFixed(2))
              };
            }
            return l;
          });
          
          const updatedHoldings = state.holdings.map(h => 
            h.symbol === symbol ? { ...h, currentPrice: Number(newPrice.toFixed(2)) } : h
          );
          
          return {
            marketListings: updatedListings,
            holdings: updatedHoldings,
          };
        });
      },

      getPortfolio: () => {
        const { holdings } = get();
        const totalValue = holdings.reduce(
          (sum, h) => sum + h.shares * h.currentPrice,
          0
        );
        const totalCost = holdings.reduce(
          (sum, h) => sum + h.shares * h.purchasePrice,
          0
        );
        const totalGainLoss = totalValue - totalCost;
        const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

        return {
          holdings,
          totalValue,
          totalCost,
          totalGainLoss,
          totalGainLossPercent,
        };
      },
    }),
    {
      name: 'antigravity-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated, 
        holdings: state.holdings, 
        marketListings: state.marketListings,
        pendingPurchase: state.pendingPurchase,
        notifications: state.notifications,
        registeredUsers: state.registeredUsers
      }),
    }
  )
);
