'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Mail, Lock, Check } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Logo } from '@/components/ui/Logo';

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated } = useAuthStore();
  const requestLoginOTP = useAuthStore((state) => state.requestLoginOTP);
  const verifyLoginOTP = useAuthStore((state) => state.verifyLoginOTP);

  useEffect(() => {
    const savedEmail = localStorage.getItem('antigravity_email') || '';
    const savedPassword = localStorage.getItem('antigravity_password') || '';
    if (savedEmail) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    if (rememberMe) {
      localStorage.setItem('antigravity_email', email);
      localStorage.setItem('antigravity_password', password);
    } else {
      localStorage.removeItem('antigravity_email');
      localStorage.removeItem('antigravity_password');
    }

    const success = await requestLoginOTP(email, password, rememberMe);
    if (!success) {
      setError('Invalid email or password. Please try again.');
      setIsLoading(false);
    } else {
      setStep('otp');
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (otp.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      setIsLoading(false);
      return;
    }

    const success = await verifyLoginOTP(email, otp);
    if (!success) {
      setError('Invalid or expired verification code. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-[#0C121A] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]"
      style={{ backgroundImage: 'radial-gradient(circle at top right, #1b2735 0%, #0c121a 100%)' }}
    >
      <div className="absolute inset-0 bg-[#0C121A]/40 backdrop-blur-sm z-0"></div>
      
      <div className="w-full max-w-5xl z-10 flex flex-col md:flex-row shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden border border-slate-700/50">
        
        {/* Left Informational Side */}
        <div className="md:w-1/2 p-10 lg:p-14 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-700/50 relative overflow-hidden bg-gradient-to-br from-[#121A25] to-[#0A0F16]">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <Logo className="w-24 h-24" />
            </div>
            
            <h1 className="text-3xl font-bold text-white tracking-tight leading-none mb-2">
              Antigravity Financial
            </h1>
            <h2 className="text-lg font-light uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 mb-8">
              Rising Against Gravity
            </h2>
            
            <div className="space-y-6">
              <p className="text-slate-400 text-lg leading-relaxed font-light">
                Experience the future of investing. We are committed to assuring **smooth, secure transactions**, **real-time insights**, and unparalleled portfolio growth directly at your fingertips.
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Bank-grade security & end-to-end encryption</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Live market data streams</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Instant OTP verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-[#0B1018]/95 relative">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                {step === 'credentials' ? 'Welcome back' : 'Verify your identity'}
              </h3>
              <p className="text-slate-400">
                {step === 'credentials' 
                  ? 'Enter your credentials to access your portfolio'
                  : `We've sent a 6-digit code to ${email}`}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400 mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        rememberMe 
                          ? 'bg-emerald-500 border-emerald-500' 
                          : 'border-slate-600 group-hover:border-slate-500'
                      }`}
                    >
                      {rememberMe && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-slate-300">Remember me</span>
                  </label>
                  <button 
                    type="button"
                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium tracking-wide py-2.5 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-slate-600/50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending code...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                
                <div className="pt-4 text-center">
                  <p className="text-slate-400">
                    Don't have an account?{' '}
                    <button
                      onClick={() => router.push('/signup')}
                      className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      Create one
                    </button>
                  </p>
                </div>
                
                <div className="mt-8 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-center text-slate-500">
                    Demo credentials: any email/password will work.
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="flex justify-center py-4">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} className="gap-2">
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="w-12 h-12 text-lg bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20" />
                      <InputOTPSlot index={1} className="w-12 h-12 text-lg bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20" />
                      <InputOTPSlot index={2} className="w-12 h-12 text-lg bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20" />
                      <InputOTPSlot index={3} className="w-12 h-12 text-lg bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20" />
                      <InputOTPSlot index={4} className="w-12 h-12 text-lg bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20" />
                      <InputOTPSlot index={5} className="w-12 h-12 text-lg bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500 focus:ring-emerald-500/20" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium tracking-wide py-2.5 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-slate-600/50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep('credentials');
                      setOtp('');
                      setError('');
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    Back to login
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
