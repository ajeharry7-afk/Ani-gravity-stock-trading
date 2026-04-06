import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Bell, 
  Smartphone,
  Edit2,
  Check,
  X,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';

export function ProfileView() {
  const { user, logout, updateUser, updatePassword, toggle2FA } = useAuthStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState(user?.email || '');

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [password, setPassword] = useState('');

  const handleSaveName = () => {
    updateUser({ name });
    setIsEditingName(false);
  };

  const handleSaveEmail = () => {
    updateUser({ email });
    setIsEditingEmail(false);
  };
  
  const handleSavePassword = () => {
    if (password.trim() !== '') {
        updatePassword(password);
    }
    setPassword('');
    setIsEditingPassword(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <p className="text-slate-400">Manage your account settings and preferences</p>
      </div>

      {/* Profile Header Card */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-slate-700">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-2xl font-bold">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center hover:bg-slate-600 transition-colors">
                <Edit2 className="w-4 h-4 text-slate-300" />
              </button>
            </div>
            
            <div className="text-center sm:text-left flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="max-w-xs bg-slate-900/50 border-slate-600 text-white"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSaveName}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => {
                      setName(user?.name || '');
                      setIsEditingName(false);
                    }}
                    className="border-slate-600 text-white hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-2xl font-bold text-white">{user?.name}</h3>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded hover:bg-slate-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}
              <p className="text-slate-400 mt-1">{user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                  Premium Member
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  Active
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Email</span>
              </div>
              {isEditingEmail ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-48 bg-slate-800 border-slate-600 text-white h-8 text-sm"
                  />
                  <Button size="sm" onClick={handleSaveEmail} className="bg-emerald-500 hover:bg-emerald-600 h-8 px-2">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEmail(user?.email || ''); setIsEditingEmail(false); }} className="border-slate-600 h-8 px-2 text-white hover:text-white">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white">
                  <span>{user?.email}</span>
                  <button onClick={() => setIsEditingEmail(true)} className="p-1 rounded-md hover:bg-slate-700 transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Member Since</span>
              </div>
              <span className="text-white">
                {user?.createdAt ? formatDate(new Date(user.createdAt)) : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Account Type</span>
              </div>
              <span className="text-white">Individual Investor</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Price Alerts</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400">Enabled</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Email Notifications</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Push Notifications</span>
              </div>
              <Badge variant="outline" className="border-slate-600 text-slate-400">Disabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Change Password</p>
                <p className="text-sm text-slate-400">Update your account password</p>
              </div>
              {!isEditingPassword ? (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingPassword(true)} 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Change
                </Button>
              ) : null}
            </div>
            
            {isEditingPassword && (
              <div className="mt-4 flex items-center gap-3">
                <Input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="max-w-xs bg-slate-800 border-slate-600 text-white"
                />
                <Button onClick={handleSavePassword} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  Save
                </Button>
                <Button variant="ghost" onClick={() => { setPassword(''); setIsEditingPassword(false); }} className="text-slate-400 hover:text-white">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
            <div>
              <p className="font-medium text-white">Two-Factor Authentication (2FA)</p>
              <p className="text-sm text-slate-400">Add an extra layer of security</p>
            </div>
            <Button 
              onClick={toggle2FA}
              variant={user?.twoFactorEnabled ? "default" : "outline"}
              className={user?.twoFactorEnabled ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
            >
              {user?.twoFactorEnabled ? 'Enabled' : 'Enable'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
            <div>
              <p className="font-medium text-white">Login History</p>
              <p className="text-sm text-slate-400">View recent login activity</p>
            </div>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-red-500/5 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div>
              <p className="font-medium text-red-400">Delete Account</p>
              <p className="text-sm text-red-400/70">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" className="bg-red-500 hover:bg-red-600">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
