'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Search, TrendingUp, AlertCircle, Save, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export function AdminDashboardView() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editBalance, setEditBalance] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchUsersFromDB = async () => {
    try {
      const response = await fetch(`/api/users`);
      if (response.ok) {
        const usersList = await response.json();
        usersList.sort((a: any, b: any) => {
          const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
          const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
          return timeB - timeA;
        });
        setUsers(usersList);
      }
    } catch (error) {
      console.error('DB sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sync any locally registered users into Supabase
    const localUsers = Object.values(useAuthStore.getState().registeredUsers || {});
    localUsers.forEach((u: any) => {
      fetch(`/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...u, email: u.user?.email || u.email || 'unknown' })
      }).catch(() => {});
    });

    fetchUsersFromDB();
    const interval = setInterval(fetchUsersFromDB, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManageClick = (u: any) => {
    setSelectedUser(u);
    setEditBalance(u.account_balance?.toString() || '0');
    setSaveSuccess(false);
    setIsSheetOpen(true);
  };

  const handleSaveUserUpdates = async () => {
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

      // Send notification if balance changed
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
      fetchUsersFromDB();
    } catch (e) {
      console.error('Failed to update user', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkHoldingComplete = async (userEmail: string, holdingId: string) => {
    try {
      await fetch(`/api/holdings/${holdingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', userEmail }),
      });
      fetchUsersFromDB();
      // Refresh selected user too
      if (selectedUser?.email === userEmail) {
        setSelectedUser((prev: any) => ({
          ...prev,
          holdings: prev.holdings?.map((h: any) =>
            h.id === holdingId ? { ...h, status: 'completed' } : h
          ),
        }));
      }
    } catch (e) {
      console.error('Failed to update holding status', e);
    }
  };

  // Stats
  const totalCapital = users.reduce((sum, u) => sum + (u.account_balance || 0), 0);
  const pendingHoldings = users.reduce((sum, u) => {
    return sum + (u.holdings?.filter((h: any) => h.status === 'processing').length || 0);
  }, 0);

  const filteredUsers = users.filter(u => {
    const name = u.name || '';
    const email = u.email || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          Admin Command Center
        </h2>
        <p className="text-slate-400">Monitor platform activity and manage all registered user accounts securely.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Total Registered Users</p>
                <h3 className="text-3xl font-bold text-white">{loading ? '...' : users.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Total Platform Capital</p>
                <h3 className="text-3xl font-bold text-white">{loading ? '...' : formatCurrency(totalCapital)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Pending Orders</p>
                <h3 className="text-3xl font-bold text-white">{loading ? '...' : pendingHoldings}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg">
        <CardHeader className="border-b border-slate-700/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg text-white font-medium">User Database</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9 bg-slate-900 border-slate-700 text-white rounded-lg focus-visible:ring-emerald-500/50 h-9"
              />
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
                  <th className="px-6 py-4 font-medium">Cash Balance</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium">2FA</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-slate-400 animate-pulse">Syncing user database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                      <p>No users found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, i) => (
                    <tr key={i} className="hover:bg-[#121A25] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                            {(u.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200 group-hover:text-white">{u.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {u.holdings?.length || 0} holding{u.holdings?.length !== 1 ? 's' : ''}
                              {(u.holdings?.filter((h: any) => h.status === 'processing').length || 0) > 0 && (
                                <span className="ml-1 text-amber-400">
                                  · {u.holdings.filter((h: any) => h.status === 'processing').length} pending
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-400 font-mono font-medium">
                          {formatCurrency(u.account_balance || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 text-xs">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recently'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={u.two_factor_enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                          }
                        >
                          {u.two_factor_enabled ? 'Secure' : 'Standard'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleManageClick(u)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all font-medium whitespace-nowrap"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Manage User Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white shadow-2xl sm:max-w-md w-full overflow-y-auto">
          <SheetHeader className="border-b border-slate-800 pb-4 mb-6">
            <SheetTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              User Control Panel
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Manage {selectedUser?.name}'s account.
            </SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Profile */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                  {(selectedUser.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedUser.name}</h3>
                  <p className="text-sm text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              {/* KYC */}
              {selectedUser.kyc_data && (
                <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">KYC Data</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-500">SSN</div>
                    <div className="text-slate-200 text-right font-mono">{selectedUser.kyc_data.ssn || 'N/A'}</div>
                    <div className="text-slate-500">Date of Birth</div>
                    <div className="text-slate-200 text-right">{selectedUser.kyc_data.dob || 'N/A'}</div>
                    <div className="text-slate-500">Phone</div>
                    <div className="text-slate-200 text-right">{selectedUser.kyc_data.phone || 'N/A'}</div>
                    <div className="text-slate-500">Address</div>
                    <div className="text-slate-200 text-right text-xs">{selectedUser.kyc_data.address || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Holdings */}
              {selectedUser.holdings?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Holdings</h4>
                  <div className="space-y-2">
                    {selectedUser.holdings.map((h: any) => (
                      <div key={h.id} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                        <div>
                          <p className="font-semibold text-white text-sm">{h.symbol}</p>
                          <p className="text-xs text-slate-400">{h.shares} shares · ${Number(h.purchase_price).toFixed(2)}/sh</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {h.status === 'processing' ? (
                            <button
                              onClick={() => handleMarkHoldingComplete(selectedUser.email, h.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-400 transition-all text-xs font-medium"
                            >
                              <Clock className="w-3 h-3" />
                              Mark Complete
                            </button>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Balance */}
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
                <p className="text-xs text-slate-500">Update after a wire or crypto payment is confirmed.</p>
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4" />
                  Changes saved successfully.
                </div>
              )}

              <Button
                onClick={handleSaveUserUpdates}
                disabled={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Apply Changes
                  </span>
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
