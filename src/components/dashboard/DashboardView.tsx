'use client';

import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, ArrowUpRight, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

export function DashboardView() {
  const { getPortfolio, user, holdings } = useAuthStore();
  const portfolio = getPortfolio();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

  // Build performance chart from actual holdings purchase cost vs current value over time
  const performanceData = useMemo(() => {
    if (holdings.length === 0) return [];
    const sorted = [...holdings].sort(
      (a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
    );
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const byMonth: Record<string, number> = {};
    let runningValue = 0;
    sorted.forEach((h) => {
      const d = new Date(h.purchaseDate);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      runningValue += h.shares * h.currentPrice;
      byMonth[key] = runningValue;
    });
    return Object.entries(byMonth).map(([month, value]) => ({ month, value }));
  }, [holdings]);

  // Top performers from actual holdings sorted by gain %
  const topPerformers = useMemo(() => {
    return [...holdings]
      .map((h) => ({
        symbol: h.symbol,
        name: h.companyName,
        price: h.currentPrice,
        change: ((h.currentPrice - h.purchasePrice) / h.purchasePrice) * 100,
      }))
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);
  }, [holdings]);

  // Best performer
  const bestPerformer = topPerformers[0] ?? null;

  // Largest holding by value
  const largestHolding = useMemo(() => {
    return [...holdings].sort((a, b) => b.shares * b.currentPrice - a.shares * a.currentPrice)[0] ?? null;
  }, [holdings]);

  // Sector diversity
  const uniqueSectors = useMemo(() => holdings.length, [holdings]);

  const hasHoldings = holdings.length > 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0] || 'Investor'}!</h2>
          <p className="text-slate-400">Here's what's happening with your portfolio today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Market Open
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Value</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(portfolio.totalValue)}</div>
            <div className="flex items-center gap-1 mt-1">
              {portfolio.totalGainLoss >= 0
                ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                : <TrendingDown className="w-3 h-3 text-red-400" />
              }
              <span className={`text-sm ${portfolio.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {portfolio.totalGainLoss >= 0 ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}% all time
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Gain / Loss</CardTitle>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${portfolio.totalGainLoss >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {portfolio.totalGainLoss >= 0
                ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                : <TrendingDown className="w-4 h-4 text-red-400" />
              }
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolio.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(portfolio.totalGainLoss)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-slate-400">Since inception</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Holdings</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{portfolio.holdings.length}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-slate-400">
                {portfolio.holdings.length === 1 ? 'Stock owned' : 'Stocks owned'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Cash Balance</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(user?.accountBalance ?? 0)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-slate-400">Available to invest</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px]">
              {!hasHoldings ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  No holdings yet — buy your first stock to see performance.
                </div>
              ) : performanceData.length < 2 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  Chart appears after purchases across multiple months.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(value: number) => [formatCurrency(value), 'Value']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No holdings yet.</p>
            ) : (
              <div className="space-y-4">
                {topPerformers.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div>
                      <p className="font-semibold text-white">{stock.symbol}</p>
                      <p className="text-sm text-slate-400 truncate max-w-[120px]">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{formatCurrency(stock.price)}</p>
                      <div className="flex items-center gap-1 justify-end">
                        {stock.change >= 0
                          ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                          : <TrendingDown className="w-3 h-3 text-red-400" />
                        }
                        <span className={`text-sm ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Best Performer</p>
              {bestPerformer ? (
                <>
                  <p className="font-semibold text-white">{bestPerformer.name} ({bestPerformer.symbol})</p>
                  <p className={`text-sm ${bestPerformer.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {bestPerformer.change >= 0 ? '+' : ''}{bestPerformer.change.toFixed(2)}%
                  </p>
                </>
              ) : (
                <p className="font-semibold text-slate-500">No holdings yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Largest Holding</p>
              {largestHolding ? (
                <>
                  <p className="font-semibold text-white">{largestHolding.companyName.split(' ')[0]} ({largestHolding.symbol})</p>
                  <p className="text-sm text-cyan-400">{largestHolding.shares} shares</p>
                </>
              ) : (
                <p className="font-semibold text-slate-500">No holdings yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Portfolio Diversity</p>
              <p className="font-semibold text-white">{uniqueSectors} {uniqueSectors === 1 ? 'Company' : 'Companies'}</p>
              <p className="text-sm text-purple-400">{hasHoldings ? 'Diversified portfolio' : 'Start investing'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
