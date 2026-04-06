import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, User, Users, Package } from 'lucide-react';

export function PortfolioView() {
  const { holdings, getPortfolio } = useAuthStore();
  const portfolio = getPortfolio();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const individualHoldings = holdings.filter(h => h.ownershipType === 'individual');
  const jointHoldings = holdings.filter(h => h.ownershipType === 'joint');

  const calculateHoldingValue = (holding: typeof holdings[0]) => {
    return holding.shares * holding.currentPrice;
  };

  const calculateHoldingGain = (holding: typeof holdings[0]) => {
    const cost = holding.shares * holding.purchasePrice;
    const value = holding.shares * holding.currentPrice;
    return {
      amount: value - cost,
      percent: ((value - cost) / cost) * 100,
    };
  };

  const HoldingCard = ({ holding }: { holding: typeof holdings[0] }) => {
    const gain = calculateHoldingGain(holding);
    const value = calculateHoldingValue(holding);
    const isPositive = gain.amount >= 0;

    return (
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-slate-600/50 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              holding.ownershipType === 'individual' 
                ? 'bg-emerald-500/20' 
                : 'bg-cyan-500/20'
            }`}>
              {holding.ownershipType === 'individual' ? (
                <User className="w-5 h-5 text-emerald-400" />
              ) : (
                <Users className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white">{holding.symbol}</h3>
                <Badge 
                  variant={holding.ownershipType === 'individual' ? 'default' : 'secondary'}
                  className={`text-xs ${
                    holding.ownershipType === 'individual'
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                  }`}
                >
                  {holding.ownershipType === 'individual' ? 'Individual' : 'Joint'}
                </Badge>
                {holding.status === 'processing' && (
                  <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400 bg-amber-500/10 whitespace-nowrap">
                    Processing
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-400">{holding.companyName}</p>
              {holding.jointHolderName && (
                <p className="text-xs text-slate-500">with {holding.jointHolderName}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-white">{formatCurrency(value)}</p>
            <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="text-sm">{isPositive ? '+' : ''}{gain.percent.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700/50">
          <div>
            <p className="text-xs text-slate-500 mb-1">Shares</p>
            <p className="font-semibold text-white">{holding.shares}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Avg Cost</p>
            <p className="font-semibold text-white">{formatCurrency(holding.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Current</p>
            <p className="font-semibold text-white">{formatCurrency(holding.currentPrice)}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Gain/Loss</span>
            <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{formatCurrency(gain.amount)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">My Holdings</h2>
        <p className="text-slate-400">Track all your individual and joint stock investments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Holdings</CardTitle>
            <Package className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{holdings.length}</p>
            <p className="text-sm text-slate-500">Stocks</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Individual</CardTitle>
            <User className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{individualHoldings.length}</p>
            <p className="text-sm text-slate-500">Sole ownership</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Joint</CardTitle>
            <Users className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{jointHoldings.length}</p>
            <p className="text-sm text-slate-500">Shared ownership</p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="all" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            All Holdings
          </TabsTrigger>
          <TabsTrigger value="individual" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            Individual
          </TabsTrigger>
          <TabsTrigger value="joint" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            Joint
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {holdings.map((holding) => (
              <HoldingCard key={holding.id} holding={holding} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="individual" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {individualHoldings.map((holding) => (
              <HoldingCard key={holding.id} holding={holding} />
            ))}
          </div>
          {individualHoldings.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No individual holdings yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="joint" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jointHoldings.map((holding) => (
              <HoldingCard key={holding.id} holding={holding} />
            ))}
          </div>
          {jointHoldings.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No joint holdings yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Portfolio Breakdown */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Value</p>
              <p className="text-xl font-bold text-white">{formatCurrency(portfolio.totalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Invested</p>
              <p className="text-xl font-bold text-white">{formatCurrency(portfolio.totalCost)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Gain/Loss</p>
              <p className={`text-xl font-bold ${portfolio.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(portfolio.totalGainLoss)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Return %</p>
              <p className={`text-xl font-bold ${portfolio.totalGainLossPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {portfolio.totalGainLossPercent >= 0 ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
