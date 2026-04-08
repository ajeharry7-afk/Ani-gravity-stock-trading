'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { Calculator, Info, ArrowUpRight, Sparkles } from 'lucide-react';

// Generate projection data based on current portfolio value
const generateProjectionData = (currentValue: number, monthlyContribution: number, years: number) => {
  const data = [];
  const months = years * 12;
  
  // Annual return rates
  const conservativeRate = 0.06; // 6%
  const moderateRate = 0.10;     // 10%
  const aggressiveRate = 0.15;   // 15%
  
  let conservativeValue = currentValue;
  let moderateValue = currentValue;
  let aggressiveValue = currentValue;
  
  for (let i = 0; i <= months; i++) {
    if (i > 0) {
      const monthlyConservativeRate = conservativeRate / 12;
      const monthlyModerateRate = moderateRate / 12;
      const monthlyAggressiveRate = aggressiveRate / 12;
      
      conservativeValue = (conservativeValue + monthlyContribution) * (1 + monthlyConservativeRate);
      moderateValue = (moderateValue + monthlyContribution) * (1 + monthlyModerateRate);
      aggressiveValue = (aggressiveValue + monthlyContribution) * (1 + monthlyAggressiveRate);
    }
    
    if (i % 12 === 0) {
      data.push({
        year: `Year ${i / 12}`,
        conservative: Math.round(conservativeValue),
        moderate: Math.round(moderateValue),
        aggressive: Math.round(aggressiveValue),
      });
    }
  }
  
  return data;
};

export function ProjectionsView() {
  const { getPortfolio } = useAuthStore();
  const portfolio = getPortfolio();
  
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [projectionYears, setProjectionYears] = useState(10);
  
  const projectionData = generateProjectionData(
    portfolio.totalValue, 
    monthlyContribution, 
    projectionYears
  );
  
  const finalValues = projectionData[projectionData.length - 1];
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Future Projections</h2>
        <p className="text-slate-400">See how your portfolio could grow over time</p>
      </div>

      {/* Controls */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            Projection Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Monthly Contribution */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Monthly Contribution</Label>
                <span className="text-emerald-400 font-semibold">{formatCurrency(monthlyContribution)}</span>
              </div>
              <Slider
                value={[monthlyContribution]}
                onValueChange={(value) => setMonthlyContribution(value[0])}
                min={0}
                max={5000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>$0</span>
                <span>$2,500</span>
                <span>$5,000</span>
              </div>
            </div>

            {/* Projection Years */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Projection Period</Label>
                <span className="text-emerald-400 font-semibold">{projectionYears} years</span>
              </div>
              <Slider
                value={[projectionYears]}
                onValueChange={(value) => setProjectionYears(value[0])}
                min={5}
                max={30}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>5 years</span>
                <span>15 years</span>
                <span>30 years</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projection Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-400 flex items-center gap-2">
              Conservative (6%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{formatCurrency(finalValues.conservative)}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">
                +{formatCurrency(finalValues.conservative - portfolio.totalValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Moderate (10%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{formatCurrency(finalValues.moderate)}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">
                +{formatCurrency(finalValues.moderate - portfolio.totalValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-400 flex items-center gap-2">
              Aggressive (15%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{formatCurrency(finalValues.aggressive)}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400">
                +{formatCurrency(finalValues.aggressive - portfolio.totalValue)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Growth Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorModerate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAggressive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#64748b" />
                <YAxis 
                  stroke="#64748b" 
                  tickFormatter={formatCurrencyCompact}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="conservative" 
                  name="Conservative (6%)"
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorConservative)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="moderate" 
                  name="Moderate (10%)"
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorModerate)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="aggressive" 
                  name="Aggressive (15%)"
                  stroke="#a855f7" 
                  fillOpacity={1} 
                  fill="url(#colorAggressive)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-white">Important:</span> These projections are estimates based on historical 
            average market returns and do not guarantee future performance. Actual returns may vary. 
            The conservative estimate assumes 6% annual growth, moderate assumes 10%, and aggressive assumes 15%.
          </p>
        </div>
      </div>
    </div>
  );
}
