'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Shield, Search, TrendingUp, AlertCircle, Save, DollarSign,
  CheckCircle, Ban, MessageSquare, Download, Filter, X,
  ChevronDown, PieChart, Edit3, Send,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

const calcPortfolioValue = (u: any) =>
  (u.holdings ?? []).reduce((sum: number, h: any) => sum + (h.shares * h.current_price), 0);

type FilterType = 'all' | 'pending' | 'has_balance' | 'blocked';

export function AdminDashboardView() {
  const { marketListings, updateMarketAndHoldingPrice } = useAuthStore();

  // ── Users state ────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // ── Selected user sheet ────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // ── Balance tab ────────────────────────────────────────────────────────────
  const [editBalance, setEditBalance] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Message tab ────────────────────────────────────────────────────────────
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgType, setMsgType] = useState<'info' | 'success' | 'warning'>('info');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  // ── Block state ────────────────────────────────────────────────────────────
  const [isBlocking, setIsBlocking] = useState(false);

  // ── Market prices tab ──────────────────────────────────────────────────────
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [savedPrices, setSavedPrices] = useState<Record<string, boolean>>({});

  // ── Fetch users ────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const list = await res.json();
        list.sort((a: any, b: any) =>
          new Date(b.updated_at || b.created_at || 0).getTime() -
          new Date(a.updated_at || a.created_at || 0).getTime()
        );
        setUsers(list);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sync locally registered users into Supabase
    const localUsers = Object.values(useAuthStore.getState().registeredUsers || {});
    localUsers.forEach((u: any) => {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...u, email: u.user?.email || u.email || 'unknown' }),
      }).catch(() => {});
    });
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalCapital = users.reduce((s, u) => s + (u.account_balance || 0), 0);
  const totalPortfolioValue = users.reduce((s, u) => s + calcPortfolioValue(u), 0);
  const pendingCount = users.reduce(
    (s, u) => s + (u.holdings?.filter((h: any) => h.status === 'processing').length || 0), 0
  );

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (filterType === 'pending') return (u.holdings?.filter((h: any) => h.status === 'processing').length || 0) > 0;
      if (filterType === 'has_balance') return (u.account_balance || 0) > 0;
      if (filterType === 'blocked') return u.blocked === true;
      return true;
    });
  }, [users, searchQuery, filterType]);

  // ── Open sheet ─────────────────────────────────────────────────────────────
  const handleManageClick = (u: any) => {
    setSelectedUser(u);
    setEditBalance(u.account_balance?.toString() || '0');
    setSaveSuccess(false);
    setMsgTitle('');
    setMsgBody('');
    setMsgSent(false);
    setIsSheetOpen(true);
  };

  // ── Save balance ───────────────────────────────────────────────────────────
  const handleSaveBalance = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const email = selectedUser.email;
      const newBalance = parseFloat(editBalance) || 0;
      const oldBalance = selectedUser.account_balance || 0;

      await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountBalance: newBalance }),
      });

      if (newBalance !== oldBalance) {
        const diff = newBalance - oldBalance;
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: email,
            title: diff > 0 ? 'Funds Added to Your Account' : 'Account Balance Updated',
            message: diff > 0
              ? `$${diff.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been credited to your account. Your new balance is $${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
              : `Your account balance has been updated to $${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
            type: diff > 0 ? 'success' : 'info',
          }),
        });
      }

      setSaveSuccess(true);
      setSelectedUser((prev: any) => ({ ...prev, account_balance: newBalance }));
      fetchUsers();
    } catch (e) {
      console.error('Failed to save balance', e);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!selectedUser || !msgTitle.trim() || !msgBody.trim()) return;
    setIsSendingMsg(true);
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: selectedUser.email,
          title: msgTitle.trim(),
          message: msgBody.trim(),
          type: msgType,
        }),
      });
      setMsgSent(true);
      setMsgTitle('');
      setMsgBody('');
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setIsSendingMsg(false);
    }
  };

  // ── Mark holding complete / reject ─────────────────────────────────────────
  const handleHoldingAction = async (
    userEmail: string, holdingId: string, action: 'completed' | 'rejected', reason?: string
  ) => {
    await fetch(`/api/holdings/${holdingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action, userEmail }),
    });

    if (action === 'rejected' && reason) {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          title: 'Order Rejected',
          message: reason,
          type: 'warning',
        }),
      });
    }

    setSelectedUser((prev: any) => ({
      ...prev,
      holdings: prev.holdings?.map((h: any) =>
        h.id === holdingId ? { ...h, status: action } : h
      ),
    }));
    fetchUsers();
  };

  // ── Block / Unblock ────────────────────────────────────────────────────────
  const handleToggleBlock = async () => {
    if (!selectedUser) return;
    setIsBlocking(true);
    try {
      const newBlocked = !selectedUser.blocked;
      await fetch(`/api/users/${encodeURIComponent(selectedUser.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: newBlocked }),
      });

      if (newBlocked) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: selectedUser.email,
            title: 'Account Suspended',
            message: 'Your account has been suspended by an administrator. Please contact support for more information.',
            type: 'warning',
          }),
        });
      }

      setSelectedUser((prev: any) => ({ ...prev, blocked: newBlocked }));
      fetchUsers();
    } catch (e) {
      console.error('Failed to toggle block', e);
    } finally {
      setIsBlocking(false);
    }
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Cash Balance', 'Portfolio Value', 'Holdings', 'Joined', '2FA', 'Status'];
    const rows = users.map((u) => [
      u.name || '',
      u.email || '',
      u.account_balance || 0,
      calcPortfolioValue(u).toFixed(2),
      u.holdings?.length || 0,
      u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
      u.two_factor_enabled ? 'Yes' : 'No',
      u.blocked ? 'Blocked' : 'Active',
    ]);
    const csv = [headers, ...rows].map((r) => r.map(String).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Save market price override ─────────────────────────────────────────────
  const handleSavePrice = async (symbol: string) => {
    const price = parseFloat(priceEdits[symbol]);
    if (isNaN(price) || price <= 0) return;
    await fetch('/api/market-prices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, price }),
    });
    updateMarketAndHoldingPrice(symbol, price);
    setSavedPrices((prev) => ({ ...prev, [symbol]: true }));
    setTimeout(() => setSavedPrices((prev) => ({ ...prev, [symbol]: false })), 2000);
  };

  // ── Reject reason modal state ──────────────────────────────────────────────
  const [rejectTarget, setRejectTarget] = useState<{ userEmail: string; holdingId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            Admin Command Center
          </h2>
          <p className="text-slate-400">Monitor and manage all platform activity.</p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: loading ? '...' : String(users.length), icon: Users, color: 'emerald' },
          { label: 'Total Capital', value: loading ? '...' : formatCurrency(totalCapital), icon: DollarSign, color: 'cyan' },
          { label: 'Pending Orders', value: loading ? '...' : String(pendingCount), icon: AlertCircle, color: 'amber' },
          { label: 'Portfolio Value', value: loading ? '...' : formatCurrency(totalPortfolioValue), icon: PieChart, color: 'violet' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-slate-800/50 border-slate-700/50 shadow-lg relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-28 h-28 bg-${color}-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
            <CardContent className="pt-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 bg-${color}-500/20 rounded-xl border border-${color}-500/30`}>
                  <Icon className={`w-5 h-5 text-${color}-400`} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">{label}</p>
                  <h3 className="text-2xl font-bold text-white">{value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="users" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            <Users className="w-4 h-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="market" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            <TrendingUp className="w-4 h-4 mr-2" /> Stock Prices
          </TabsTrigger>
        </TabsList>

        {/* ── Users Tab ── */}
        <TabsContent value="users" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg">
            <CardHeader className="border-b border-slate-700/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-lg text-white font-medium">User Database</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {/* Search */}
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="pl-9 bg-slate-900 border-slate-700 text-white h-9 rounded-lg focus-visible:ring-emerald-500/50"
                    />
                  </div>
                  {/* Filter */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as FilterType)}
                      className="pl-9 pr-7 h-9 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    >
                      <option value="all">All Users</option>
                      <option value="pending">Pending Orders</option>
                      <option value="has_balance">Has Balance</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 bg-[#0C121A] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Portfolio</th>
                      <th className="px-6 py-4 font-medium">Cash</th>
                      <th className="px-6 py-4 font-medium">Joined</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-slate-400 animate-pulse">Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                          <p>No users found.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, i) => {
                        const portfolioVal = calcPortfolioValue(u);
                        const pendingOrders = u.holdings?.filter((h: any) => h.status === 'processing').length || 0;
                        return (
                          <tr key={i} className="hover:bg-[#121A25] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${u.blocked ? 'bg-red-600/50' : 'bg-gradient-to-br from-emerald-500 to-cyan-500'}`}>
                                  {(u.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-200 group-hover:text-white">{u.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {u.holdings?.length || 0} holding{u.holdings?.length !== 1 ? 's' : ''}
                                    {pendingOrders > 0 && (
                                      <span className="ml-1 text-amber-400">· {pendingOrders} pending</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-300">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className="text-cyan-400 font-mono font-medium">{formatCurrency(portfolioVal)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-emerald-400 font-mono font-medium">{formatCurrency(u.account_balance || 0)}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recently'}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={u.blocked
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : u.two_factor_enabled
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }
                              >
                                {u.blocked ? 'Blocked' : u.two_factor_enabled ? 'Secure' : 'Standard'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleManageClick(u)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all font-medium"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Market Prices Tab ── */}
        <TabsContent value="market" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white text-lg">Manual Price Overrides</CardTitle>
              <p className="text-slate-400 text-sm">Set prices for private/unlisted stocks not covered by live data. Changes apply to all users on their next login.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 bg-[#0C121A] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Symbol</th>
                      <th className="px-6 py-4">Company</th>
                      <th className="px-6 py-4">Current Price</th>
                      <th className="px-6 py-4">Set New Price</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {marketListings.map((stock) => (
                      <tr key={stock.symbol} className="hover:bg-[#121A25] transition-colors">
                        <td className="px-6 py-3">
                          <span className="font-bold text-white font-mono">{stock.symbol}</span>
                        </td>
                        <td className="px-6 py-3 text-slate-300">{stock.companyName}</td>
                        <td className="px-6 py-3 text-emerald-400 font-mono">${stock.currentPrice.toFixed(2)}</td>
                        <td className="px-6 py-3 w-40">
                          <Input
                            type="number"
                            placeholder={stock.currentPrice.toFixed(2)}
                            value={priceEdits[stock.symbol] || ''}
                            onChange={(e) => setPriceEdits((prev) => ({ ...prev, [stock.symbol]: e.target.value }))}
                            className="bg-slate-900 border-slate-700 text-white h-8 text-sm font-mono focus-visible:ring-emerald-500/50"
                          />
                        </td>
                        <td className="px-6 py-3 text-right">
                          {savedPrices[stock.symbol] ? (
                            <span className="flex items-center justify-end gap-1 text-emerald-400 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> Saved
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSavePrice(stock.symbol)}
                              disabled={!priceEdits[stock.symbol]}
                              className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Edit3 className="w-3 h-3 inline mr-1" />Set
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── User Management Sheet ── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white shadow-2xl sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader className="border-b border-slate-800 pb-4 mb-4">
            <SheetTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              User Control Panel
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Managing {selectedUser?.name}
            </SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <>
              {/* Profile header */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0 ${selectedUser.blocked ? 'bg-red-600/50' : 'bg-gradient-to-br from-emerald-500 to-cyan-500'}`}>
                  {(selectedUser.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white">{selectedUser.name}</h3>
                  <p className="text-sm text-slate-400 truncate">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className={selectedUser.blocked ? 'text-red-400 border-red-500/30 bg-red-500/10 text-xs' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs'}>
                      {selectedUser.blocked ? 'Blocked' : 'Active'}
                    </Badge>
                    {selectedUser.two_factor_enabled && (
                      <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 bg-cyan-500/10 text-xs">2FA On</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="overview">
                <TabsList className="w-full bg-slate-800/50 border border-slate-700/50 mb-4">
                  <TabsTrigger value="overview" className="flex-1 text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Overview</TabsTrigger>
                  <TabsTrigger value="holdings" className="flex-1 text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Orders</TabsTrigger>
                  <TabsTrigger value="balance" className="flex-1 text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Balance</TabsTrigger>
                  <TabsTrigger value="message" className="flex-1 text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Message</TabsTrigger>
                  <TabsTrigger value="account" className="flex-1 text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Account</TabsTrigger>
                </TabsList>

                {/* Overview */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1">Cash Balance</p>
                      <p className="font-bold text-emerald-400">{formatCurrency(selectedUser.account_balance || 0)}</p>
                    </div>
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1">Portfolio Value</p>
                      <p className="font-bold text-cyan-400">{formatCurrency(calcPortfolioValue(selectedUser))}</p>
                    </div>
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1">Holdings</p>
                      <p className="font-bold text-white">{selectedUser.holdings?.length || 0}</p>
                    </div>
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-1">Joined</p>
                      <p className="font-bold text-white text-sm">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  {selectedUser.kyc_data && (
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">KYC Data</h4>
                      {[
                        ['SSN', selectedUser.kyc_data.ssn],
                        ['Date of Birth', selectedUser.kyc_data.dob],
                        ['Phone', selectedUser.kyc_data.phone],
                        ['Address', selectedUser.kyc_data.address],
                      ].map(([k, v]) => v && (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-slate-500">{k}</span>
                          <span className="text-slate-200 text-right font-mono text-xs">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Orders / Holdings */}
                <TabsContent value="holdings" className="space-y-3">
                  {(!selectedUser.holdings || selectedUser.holdings.length === 0) ? (
                    <p className="text-center text-slate-500 py-8">No holdings yet.</p>
                  ) : (
                    selectedUser.holdings.map((h: any) => (
                      <div key={h.id} className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-white">{h.symbol}
                              <span className="text-slate-400 font-normal text-xs ml-2">{h.company_name}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {h.shares} shares · ${Number(h.purchase_price).toFixed(2)}/sh · {h.ownership_type}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {h.purchase_date ? new Date(h.purchase_date).toLocaleDateString() : ''}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {h.status === 'processing' ? (
                              <>
                                <button
                                  onClick={() => handleHoldingAction(selectedUser.email, h.id, 'completed')}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white text-xs transition-all"
                                >
                                  <CheckCircle className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectTarget({ userEmail: selectedUser.email, holdingId: h.id })}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white text-xs transition-all"
                                >
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </>
                            ) : (
                              <Badge className={`text-xs ${h.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {h.status === 'completed' ? <CheckCircle className="w-3 h-3 mr-1 inline" /> : <X className="w-3 h-3 mr-1 inline" />}
                                {h.status.charAt(0).toUpperCase() + h.status.slice(1)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Reject reason inline form */}
                  {rejectTarget && (
                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-3">
                      <p className="text-sm text-red-400 font-medium">Rejection reason (sent to user)</p>
                      <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Payment not received within 24 hours."
                        className="bg-slate-900 border-slate-700 text-white text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            await handleHoldingAction(rejectTarget.userEmail, rejectTarget.holdingId, 'rejected', rejectReason);
                            setRejectTarget(null);
                            setRejectReason('');
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm"
                        >
                          Confirm Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                          className="border-slate-700 text-slate-300 text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Balance */}
                <TabsContent value="balance" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Liquid Cash Balance
                    </Label>
                    <Input
                      type="number"
                      value={editBalance}
                      onChange={(e) => { setEditBalance(e.target.value); setSaveSuccess(false); }}
                      className="bg-black/50 border-slate-700 font-mono text-lg text-emerald-400 focus-visible:ring-emerald-500/50"
                    />
                    <p className="text-xs text-slate-500">Update after wire transfer or crypto payment is confirmed.</p>
                  </div>

                  {saveSuccess && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                      <CheckCircle className="w-4 h-4" /> Balance updated successfully.
                    </div>
                  )}

                  <Button
                    onClick={handleSaveBalance}
                    disabled={isSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Apply Balance</span>
                    )}
                  </Button>
                </TabsContent>

                {/* Message */}
                <TabsContent value="message" className="space-y-4">
                  <p className="text-xs text-slate-400">Send a notification directly to {selectedUser.name}. They will see it next time they log in.</p>

                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Type</Label>
                    <div className="flex gap-2">
                      {(['info', 'success', 'warning'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setMsgType(t)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${msgType === t
                            ? t === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                              : t === 'warning' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Title</Label>
                    <Input
                      value={msgTitle}
                      onChange={(e) => { setMsgTitle(e.target.value); setMsgSent(false); }}
                      placeholder="e.g. Your transfer has been received"
                      className="bg-slate-900 border-slate-700 text-white focus-visible:ring-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Message</Label>
                    <Textarea
                      value={msgBody}
                      onChange={(e) => { setMsgBody(e.target.value); setMsgSent(false); }}
                      placeholder="Write your message here..."
                      className="bg-slate-900 border-slate-700 text-white resize-none focus-visible:ring-emerald-500/50"
                      rows={4}
                    />
                  </div>

                  {msgSent && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                      <CheckCircle className="w-4 h-4" /> Message sent successfully.
                    </div>
                  )}

                  <Button
                    onClick={handleSendMessage}
                    disabled={isSendingMsg || !msgTitle.trim() || !msgBody.trim()}
                    className="w-full bg-cyan-700 hover:bg-cyan-600 text-white"
                  >
                    {isSendingMsg ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Send Message</span>
                    )}
                  </Button>
                </TabsContent>

                {/* Account */}
                <TabsContent value="account" className="space-y-4">
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      Account Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email</span>
                        <span className="text-slate-200">{selectedUser.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Joined</span>
                        <span className="text-slate-200">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">2FA</span>
                        <span className={selectedUser.two_factor_enabled ? 'text-emerald-400' : 'text-slate-400'}>
                          {selectedUser.two_factor_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status</span>
                        <span className={selectedUser.blocked ? 'text-red-400' : 'text-emerald-400'}>
                          {selectedUser.blocked ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border space-y-3 ${selectedUser.blocked ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <h4 className={`text-sm font-semibold flex items-center gap-2 ${selectedUser.blocked ? 'text-emerald-400' : 'text-red-400'}`}>
                      <Ban className="w-4 h-4" />
                      {selectedUser.blocked ? 'Restore Account' : 'Suspend Account'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {selectedUser.blocked
                        ? 'This user is currently suspended. Restoring will allow them to log in again.'
                        : 'Suspending will immediately prevent this user from logging in. A notification will be sent to them.'}
                    </p>
                    <Button
                      onClick={handleToggleBlock}
                      disabled={isBlocking}
                      className={`w-full ${selectedUser.blocked ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-700 hover:bg-red-600'} text-white`}
                    >
                      {isBlocking ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Ban className="w-4 h-4" />
                          {selectedUser.blocked ? 'Restore Account' : 'Suspend Account'}
                        </span>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
