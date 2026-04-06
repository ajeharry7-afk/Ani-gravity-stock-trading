import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, LogOut, Settings, Bell, Menu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Logo } from '@/components/ui/Logo';
import { useState } from 'react';
import type { AppNotification } from '@/types';

interface HeaderProps {
  onMenuClick?: () => void;
  onViewChange?: (view: any) => void;
}

export function Header({ onMenuClick, onViewChange }: HeaderProps) {
  const { user, logout, notifications, markNotificationsAsRead } = useAuthStore();
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-400" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
              <Logo className="w-10 h-10" />
            </div>
            <div className="hidden sm:flex sm:flex-col sm:justify-center">
              <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-0.5">Antigravity Financial</h1>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-cyan-400">Rising Against Gravity</p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <DropdownMenu onOpenChange={(open) => { if (!open) markNotificationsAsRead(); }}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors relative">
                <Bell className="w-5 h-5 text-slate-400" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-slate-800 border-slate-700 max-h-[80vh] overflow-y-auto">
              <div className="px-4 py-3 border-b border-slate-700 sticky top-0 bg-slate-800/95 backdrop-blur z-10 font-medium flex justify-between items-center">
                <span className="text-white">Notifications</span>
                {notifications.some(n => !n.read) && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    {notifications.filter(n => !n.read).length} new
                  </span>
                )}
              </div>
              <div className="py-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                    <Bell className="w-8 h-8 text-slate-600 mb-1" />
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem 
                      key={notif.id} 
                      onClick={() => setSelectedNotification(notif)}
                      className={`flex flex-col items-start px-4 py-3 cursor-pointer focus:bg-slate-700/50 rounded-none ${!notif.read ? 'bg-slate-700/20' : ''}`}
                    >
                      <div className="flex w-full justify-between items-start mb-1 gap-4">
                        <span className={`font-medium text-sm ${notif.type === 'success' ? 'text-emerald-400' : notif.type === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">
                          {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed truncate w-full">
                        {notif.message.length > 50 ? notif.message.substring(0, 50) + "..." : notif.message}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-3 hover:bg-slate-800 px-3 py-2 h-auto"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shadow-inner">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
              <div className="px-3 py-2 sm:hidden">
                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-slate-700 sm:hidden" />
              <DropdownMenuItem 
                onClick={() => onViewChange && onViewChange('profile')}
                className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem 
                onClick={logout}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notification Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${selectedNotification?.type === 'success' ? 'text-emerald-400' : selectedNotification?.type === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>
              <Bell className="w-5 h-5" />
              {selectedNotification?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-300 leading-relaxed text-sm md:text-base">{selectedNotification?.message}</p>
            <p className="text-xs text-slate-500 mt-6">
              {selectedNotification?.date && formatDistanceToNow(new Date(selectedNotification.date), { addSuffix: true })}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSelectedNotification(null)} className="bg-slate-700 hover:bg-slate-600 hover:text-white border-none shadow-none">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
