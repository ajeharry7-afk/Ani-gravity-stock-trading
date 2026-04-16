export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'success' | 'info' | 'warning';
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  twoFactorEnabled?: boolean;
  accountBalance?: number;
}

export interface StockHolding {
  id: string;
  symbol: string;
  companyName: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  ownershipType: 'individual' | 'joint';
  jointHolderName?: string;
  purchaseDate: Date;
  status: 'processing' | 'completed' | 'rejected';
}

export interface Portfolio {
  holdings: StockHolding[];
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

export interface StockData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

export interface ProjectionData {
  month: string;
  conservative: number;
  moderate: number;
  aggressive: number;
}

export interface MarketListing {
  symbol: string;
  companyName: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  dayHigh: number;
  dayLow: number;
  sharesAvailable: number;
  sector: string;
}

export type PaymentMethod = 'wire' | 'ach' | 'credit_card' | 'crypto';

export interface PendingPurchase {
  symbol: string;
  companyName: string;
  shares: number;
  pricePerShare: number;
  totalCost: number;
  ownershipType: 'individual' | 'joint';
  jointHolderName?: string;
}

export type View = 'login' | 'signup' | 'dashboard' | 'portfolio' | 'projections' | 'profile' | 'market' | 'payment';
