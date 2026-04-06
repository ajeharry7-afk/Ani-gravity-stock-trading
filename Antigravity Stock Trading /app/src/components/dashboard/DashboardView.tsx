import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, PieChart, Activity, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock portfolio performance data
const performanceData = [
  { month: 'Jan', value: 28500 },
  { month: 'Feb', value: 29200 },
  { month: 'Mar', value: 28800 },
  { month: 'Apr', value: 30100 },
  { month: 'May', value: 31500 },
  { month: 'Jun', value: 32847 },
];

// Top performing stocks
const topStocks = [
  { symbol: 'NVDA', name: 'NVIDIA', change: 47.8, price: 177.39 },
  { symbol: 'TSLA', name: 'Tesla', change: 44.2, price: 360.59 },
  { symbol: 'AAPL', name: 'Apple', change: 41.8, price: 255.92 },
];

export function DashboardView() {
  const { getPortfolio, user } = useAuthStore();
  const portfolio = getPortfolio();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
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

      {/* Portfolio Overview Cards */}
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
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span className="text-sm text-emerald-400">+{formatPercentage(portfolio.totalGainLossPercent)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Gain/Loss</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
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
              <span className="text-sm text-slate-400">Stocks owned</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Day's Change</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">+1.24%</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-slate-400">+$405.20 today</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Performance Chart */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Value']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStocks.map((stock) => (
                <div 
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                >
                  <div>
                    <p className="font-semibold text-white">{stock.symbol}</p>
                    <p className="text-sm text-slate-400">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">${stock.price}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-sm text-emerald-400">+{stock.change}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <p className="font-semibold text-white">NVIDIA (NVDA)</p>
              <p className="text-sm text-emerald-400">+47.8%</p>
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
              <p className="font-semibold text-white">Apple (AAPL)</p>
              <p className="text-sm text-cyan-400">50 shares</p>
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
              <p className="font-semibold text-white">5 Companies</p>
              <p className="text-sm text-purple-400">3 sectors</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
