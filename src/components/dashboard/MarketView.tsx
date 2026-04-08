'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  User,
  Users,
  DollarSign,
  Filter
} from 'lucide-react';

export function MarketView() {
  const router = useRouter();
  const { marketListings, setPendingPurchase, getPortfolio } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [purchaseDialog, setPurchaseDialog] = useState<{
    isOpen: boolean;
    stock: typeof marketListings[0] | null;
  }>({ isOpen: false, stock: null });
  const [sharesToBuy, setSharesToBuy] = useState(1);
  const [ownershipType, setOwnershipType] = useState<'individual' | 'joint'>('individual');
  const [jointHolderName, setJointHolderName] = useState('');

  const portfolio = getPortfolio();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1000000000000) {
      return `$${(value / 1000000000000).toFixed(2)}T`;
    }
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    }
    return `$${(value / 1000000).toFixed(2)}M`;
  };

  // Get unique sectors
  const sectors = ['all', ...Array.from(new Set(marketListings.map(l => l.sector)))];

  // Filter stocks
  const filteredStocks = marketListings.filter(stock => {
    const matchesSearch = 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'all' || stock.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const handleProceedToPayment = () => {
    if (!purchaseDialog.stock) return;
    
    // Set pending purchase and redirect to payment
    setPendingPurchase({
      symbol: purchaseDialog.stock.symbol,
      companyName: purchaseDialog.stock.companyName,
      shares: sharesToBuy,
      pricePerShare: purchaseDialog.stock.currentPrice,
      totalCost: sharesToBuy * purchaseDialog.stock.currentPrice,
      ownershipType: ownershipType,
      jointHolderName: ownershipType === 'joint' ? jointHolderName : undefined,
    });
    
    // Close dialog and navigate to payment
    setPurchaseDialog({ isOpen: false, stock: null });
    setSharesToBuy(1);
    setJointHolderName('');
    router.push('/payment');
  };

  const totalPurchaseCost = purchaseDialog.stock 
    ? sharesToBuy * purchaseDialog.stock.currentPrice 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Stock Market</h2>
          <p className="text-slate-400">Browse and purchase available stocks</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-slate-400">Portfolio Value:</span>
          <span className="font-semibold text-white">{formatCurrency(portfolio.totalValue)}</span>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by symbol or company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-4 py-2 rounded-md bg-slate-900/50 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Sectors</option>
                {sectors.filter(s => s !== 'all').map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStocks.map((stock) => {
          const isPositive = stock.change >= 0;
          
          return (
            <Card 
              key={stock.symbol} 
              className="bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/30 transition-all group"
            >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{stock.symbol}</h3>
                      <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                        {stock.sector}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{stock.companyName}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    isPositive ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <span className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <p className="text-3xl font-bold text-white">{formatCurrency(stock.currentPrice)}</p>
                  <p className={`text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(stock.change)} today
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-500 mb-1">Market Cap</p>
                    <p className="text-sm font-medium text-white">{formatMarketCap(stock.marketCap)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-500 mb-1">Volume</p>
                    <p className="text-sm font-medium text-white">{formatNumber(stock.volume)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-500 mb-1">Day Range</p>
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(stock.dayLow)} - {formatCurrency(stock.dayHigh)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <p className="text-xs text-slate-500 mb-1">Available</p>
                    <p className="text-sm font-medium text-emerald-400">{formatNumber(stock.sharesAvailable)} shares</p>
                  </div>
                </div>

                {/* Buy Button */}
                <Button
                  onClick={() => setPurchaseDialog({ isOpen: true, stock })}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Shares
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStocks.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No stocks found matching your search</p>
        </div>
      )}

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setPurchaseDialog({ isOpen: false, stock: null });
          setSharesToBuy(1);
          setJointHolderName('');
        }
      }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Purchase {purchaseDialog.stock?.symbol}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {purchaseDialog.stock?.companyName} - {formatCurrency(purchaseDialog.stock?.currentPrice || 0)} per share
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Shares Input */}
            <div className="space-y-2">
              <Label className="text-slate-300">Number of Shares</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSharesToBuy(Math.max(1, sharesToBuy - 1))}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  -
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={purchaseDialog.stock?.sharesAvailable}
                  value={sharesToBuy}
                  onChange={(e) => setSharesToBuy(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center bg-slate-900/50 border-slate-600 text-white"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSharesToBuy(Math.min(
                    purchaseDialog.stock?.sharesAvailable || 1, 
                    sharesToBuy + 1
                  ))}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Max available: {formatNumber(purchaseDialog.stock?.sharesAvailable || 0)} shares
              </p>
            </div>

            {/* Ownership Type */}
            <div className="space-y-2">
              <Label className="text-slate-300">Ownership Type</Label>
              <Tabs value={ownershipType} onValueChange={(v) => setOwnershipType(v as 'individual' | 'joint')}>
                <TabsList className="grid w-full grid-cols-2 bg-slate-900/50">
                  <TabsTrigger 
                    value="individual"
                    className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Individual
                  </TabsTrigger>
                  <TabsTrigger 
                    value="joint"
                    className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Joint
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Joint Holder Name */}
            {ownershipType === 'joint' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Joint Holder Name</Label>
                <Input
                  placeholder="Enter joint holder's name"
                  value={jointHolderName}
                  onChange={(e) => setJointHolderName(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            )}

            {/* Total Cost */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Shares</span>
                <span className="text-white">{sharesToBuy}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Price per share</span>
                <span className="text-white">{formatCurrency(purchaseDialog.stock?.currentPrice || 0)}</span>
              </div>
              <div className="border-t border-slate-700 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">Total</span>
                  <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalPurchaseCost)}</span>
                </div>
              </div>
            </div>

            {/* Proceed to Payment Button */}
            <Button
              onClick={handleProceedToPayment}
              disabled={ownershipType === 'joint' && !jointHolderName.trim()}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Proceed to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
