import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Search, TrendingUp, AlertCircle, Save, DollarSign } from 'lucide-react';
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
  
  // Manage Sheet State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editBalance, setEditBalance] = useState('');

  const fetchUsersFromDB = async () => {
    try {
      const response = await fetch(`http://${window.location.hostname}:3001/api/users`);
      if (response.ok) {
        const usersList = await response.json();
        usersList.sort((a: any, b: any) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setUsers(usersList);
      }
    } catch (error) {
      console.error("Local DB sync error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🚀 Instantly sync any locally registered users into the Universal Database!
    const localUsers = Object.values(useAuthStore.getState().registeredUsers || {});
    localUsers.forEach((u: any) => {
      fetch(`http://${window.location.hostname}:3001/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...u, email: u.user?.email || u.email || 'unknown' })
      }).catch(() => {});
    });

    fetchUsersFromDB();
    const interval = setInterval(fetchUsersFromDB, 2000); // 2 second live sync
    return () => clearInterval(interval);
  }, []);

  const handleManageClick = (u: any) => {
    setSelectedUser(u);
    setEditBalance(u.accountBalance?.toString() || '0');
    setIsSheetOpen(true);
  };

  const handleSaveUserUpdates = async () => {
    if (!selectedUser) return;
    try {
      await fetch(`http://${window.location.hostname}:3001/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedUser,
          accountBalance: parseFloat(editBalance) || 0
        })
      });
      setIsSheetOpen(false);
      fetchUsersFromDB(); // Force immediate refresh
    } catch (e) {
      console.error('Failed to update user', e);
    }
  };

  const filteredUsers = users.filter(u => {
    const name = u.name || u.user?.name || '';
    const email = u.email || u.user?.email || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            Admin Command Center
          </h2>
          <p className="text-slate-400">Monitor platform activity and manage all registered user accounts securely.</p>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Active Platform Capital</p>
                <h3 className="text-3xl font-bold text-white">Top Secret 👀</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Pending Verifications</p>
                <h3 className="text-3xl font-bold text-white">0</h3>
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
                  <th className="px-6 py-4 font-medium">User identity</th>
                  <th className="px-6 py-4 font-medium">Email constraints</th>
                  <th className="px-6 py-4 font-medium">Registration Target</th>
                  <th className="px-6 py-4 font-medium">2FA Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-slate-400 animate-pulse">Syncing user database from Firebase...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                      <p>No users found matching your search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, i) => (
                    <tr key={i} className="hover:bg-[#121A25] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                            {(u.name || u.user?.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200 group-hover:text-white transition-colors">{u.name || u.user?.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {u.id || u.user?.id || u.password?.substring(0,6) || 'Unknown'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300">{u.email || u.user?.email}</span>
                          {(u.email || u.user?.email || '').includes('gmail.com') && (
                            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20 shadow-none px-1 py-0">Google</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 text-xs">
                          {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recently')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant="outline" 
                          className={(u.twoFactorEnabled || u.user?.twoFactorEnabled) 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                          }
                        >
                          {(u.twoFactorEnabled || u.user?.twoFactorEnabled) ? 'Secure' : 'Vulnerable'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleManageClick(u)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all font-medium whitespace-nowrap"
                        >
                          Manage User
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

      {/* Admin Manage User Slide-out Panel */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 text-white shadow-2xl sm:max-w-md w-full">
          <SheetHeader className="border-b border-slate-800 pb-4 mb-6">
            <SheetTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              User Control Panel
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Update {selectedUser?.name || selectedUser?.user?.name}'s account data securely.
            </SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                  {(selectedUser.name || selectedUser.user?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedUser.name || selectedUser.user?.name}</h3>
                  <p className="text-sm text-slate-400">{selectedUser.email || selectedUser.user?.email}</p>
                </div>
              </div>
              
              {/* KYC Review Section (if available) */}
              {selectedUser.kycData && (
                <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">KYC Verification Data</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-500">SSN Match</div>
                    <div className="text-emerald-400 text-right">Verified</div>
                    <div className="text-slate-500">Reg. Country</div>
                    <div className="text-slate-200 text-right">{selectedUser.kycData.address?.split(',').pop() || 'Unknown'}</div>
                  </div>
                </div>
              )}

              {/* Editable Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Liquid Cash Balance
                  </Label>
                  <Input 
                    type="number"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    className="bg-black/50 border-slate-700 font-mono text-lg text-emerald-400 focus-visible:ring-emerald-500/50" 
                  />
                  <p className="text-xs text-slate-500">Update this balance immediately after a wire or crypto payment is received to fund their account.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6">
                <Button 
                  onClick={handleSaveUserUpdates}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Apply Live Changes
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
