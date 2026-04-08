'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  History,
  Shield,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminNavItems = [
  { href: '/admin', label: 'Command Center', icon: LayoutDashboard },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-16 left-0 z-50 w-64 h-[calc(100vh-4rem)] border-r border-emerald-900/40 transition-transform duration-300 lg:translate-x-0 relative overflow-hidden',
          'bg-[#060E08]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-900/15 to-transparent pointer-events-none" />

        <div className="flex flex-col h-full relative z-10">
          {/* Mobile close */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-emerald-900/30">
            <span className="text-lg font-semibold text-white">Admin</span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-emerald-900/20 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Admin badge */}
          <div className="px-4 pt-5 pb-4 border-b border-emerald-900/30">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-sm font-semibold text-emerald-400 tracking-wide">
                Admin Panel
              </span>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]'
                      : 'text-slate-400 hover:bg-emerald-900/20 hover:text-slate-200 border border-transparent'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0',
                      isActive && 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]'
                    )}
                  />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                  )}
                </button>
              );
            })}

            <div className="pt-2 border-t border-emerald-900/20 mt-2">
              <p className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-600 font-semibold">
                Quick Links
              </p>
              <button
                onClick={() => handleNavigate('/admin')}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 transition-all border border-transparent text-sm"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>All Users</span>
              </button>
              <button
                onClick={() => handleNavigate('/admin')}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 transition-all border border-transparent text-sm"
              >
                <History className="w-4 h-4 shrink-0" />
                <span>Balance Audit</span>
              </button>
              <button
                onClick={() => handleNavigate('/admin')}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 transition-all border border-transparent text-sm"
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Market Prices</span>
              </button>
            </div>
          </nav>

          {/* Back to user app */}
          <div className="p-4 border-t border-emerald-900/30">
            <button
              onClick={() => handleNavigate('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-800/40 hover:text-slate-300 transition-all"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              <span className="font-medium text-sm">Back to App</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
