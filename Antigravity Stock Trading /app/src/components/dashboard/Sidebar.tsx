import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  PieChart, 
  TrendingUp, 
  User, 
  X,
  Wallet,
  LineChart,
  ShoppingCart,
  Shield
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: 'dashboard' | 'portfolio' | 'market' | 'payment' | 'projections' | 'profile') => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'My Holdings', icon: PieChart },
  { id: 'market', label: 'Stock Market', icon: ShoppingCart },
  { id: 'projections', label: 'Projections', icon: LineChart },
  { id: 'profile', label: 'Profile', icon: User },
];

export function Sidebar({ currentView, onViewChange, isOpen, onClose }: SidebarProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.email.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || 'antigravityfinancial@gmail.com').toLowerCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:sticky top-16 left-0 z-50 w-64 h-[calc(100vh-4rem)] bg-[#0C121A] border-r border-[#16202D] transition-transform duration-300 lg:translate-x-0 relative overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/10 to-transparent pointer-events-none"></div>
        <div className="flex flex-col h-full relative z-10">
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-700/50">
            <span className="text-lg font-semibold text-white">Menu</span>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id as any);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-slate-800/50 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                      : "text-slate-400 hover:bg-[#121A25] hover:text-slate-200"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive && "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
                  )} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                  )}
                </button>
              );
            })}
            
            {/* Conditional Admin Tab */}
            {isAdmin && (
              <button
                onClick={() => {
                  onViewChange('admin' as any);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mt-4",
                  currentView === 'admin'
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                    : "text-slate-400 hover:bg-emerald-500/5 hover:text-emerald-400 border border-transparent"
                )}
              >
                <Shield className={cn(
                  "w-5 h-5",
                  currentView === 'admin' && "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"
                )} />
                <span className="font-medium">Admin Panel</span>
                <div className="ml-auto flex items-center justify-center p-1 rounded-md bg-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                </div>
              </button>
            )}
          </nav>

          <div className="p-4 border-t border-[#16202D]">
            <div className="bg-[#121A25] rounded-xl p-4 border border-[#1E293B] shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span className="text-sm border-0 font-medium text-slate-400">Total Portfolio</span>
              </div>
              <p className="text-2xl font-light text-slate-100 relative z-10">$32,847.50</p>
              <div className="flex items-center gap-1 mt-1 relative z-10">
                <TrendingUp className="w-3 h-3 text-cyan-400" />
                <span className="text-sm text-cyan-400">+12.4%</span>
                <span className="text-xs text-slate-500">this month</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
