'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, RefreshCw, Sun, Moon } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/hooks/useTheme';

const RESEND_COOLDOWN = 60;

export function SignupForm() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();

  const [step, setStep] = useState<'details' | 'kyc' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // KYC
  const [ssn, setSsn] = useState('');
  const [dob, setDob] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [regionState, setRegionState] = useState('');
  const [country, setCountry] = useState('Detecting location...');
  const [phone, setPhone] = useState('');

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestSignupOTP = useAuthStore((state) => state.requestSignupOTP);
  const verifySignupOTP = useAuthStore((state) => state.verifySignupOTP);

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  useEffect(() => {
    if (step === 'kyc') {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.country_name) setCountry(data.country_name);
          if (data.city && !city) setCity(data.city);
          if (data.region && !regionState) setRegionState(data.region);
        })
        .catch(() => setCountry('United States'));
    }
  }, [step]);

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDetailsSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters long'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 400));
    setStep('kyc');
    setIsLoading(false);
  };

  const handleKYCSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError('');
    if (!ssn || !dob || !streetAddress || !city || !country || !phone) {
      setError('Please provide all the necessary verification details to comply with financial regulations.');
      return;
    }
    const fullAddress = `${streetAddress}, ${city}, ${regionState ? regionState + ',' : ''} ${country}`;
    setIsLoading(true);
    const success = await requestSignupOTP(email, password, name, { ssn, dob, address: fullAddress, phone });
    if (!success) { setError('An account with this email already exists or the operation failed.'); setIsLoading(false); }
    else { setStep('otp'); startCooldown(); setIsLoading(false); }
  };

  const handleVerifyOTP = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Please enter all 6 digits of the verification code'); return; }
    setIsLoading(true);
    const success = await verifySignupOTP(email, otp);
    if (!success) { setError('Invalid or expired verification code. Please try again.'); setIsLoading(false); }
    else { setIsSuccess(true); setIsLoading(false); }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError(''); setIsLoading(true);
    const fullAddress = `${streetAddress}, ${city}, ${regionState ? regionState + ',' : ''} ${country}`;
    const success = await requestSignupOTP(email, password, name, { ssn, dob, address: fullAddress, phone });
    setIsLoading(false);
    if (!success) setError('Failed to resend code. Please try again.');
    else { setOtp(''); startCooldown(); }
  };

  // Shared styles
  const inputCls = 'bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20';
  const labelCls = 'text-slate-700 dark:text-slate-300';

  const stepTitle = { details: 'Create account', kyc: 'Identity Verification', otp: 'Verify your email' };
  const stepDesc = {
    details: 'Start tracking your investments today',
    kyc: 'Financial regulations require us to verify your identity',
    otp: `We've sent a 6-digit verification code to ${email}`,
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/60 via-white to-slate-100/60 dark:bg-none dark:bg-[#0C121A] p-4 relative">
        <div className="absolute inset-0 hidden dark:block bg-[#0C121A]/40 backdrop-blur-sm z-0" />
        <div className="absolute inset-0 dark:hidden opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="w-full max-w-md z-10 text-center">
          <div className="inline-flex justify-center mb-6">
            <Logo className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Antigravity Financial</h1>
          <h2 className="text-sm font-light uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 dark:from-cyan-400 dark:via-blue-400 dark:to-cyan-400 mb-8">Rising Against Gravity</h2>

          <Card className="border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#0B1018]/80 backdrop-blur-xl shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <CardContent className="pt-8 text-center pb-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Created!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Welcome to Antigravity, {name}! Your portfolio is ready.
              </p>
              <Button onClick={() => router.push('/dashboard')} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-r dark:from-slate-700 dark:to-slate-600 text-white font-medium tracking-wide">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/60 via-white to-slate-100/60 dark:bg-none dark:bg-[#0C121A] p-4 relative">
      <div className="absolute inset-0 hidden dark:block bg-[#0C121A]/40 backdrop-blur-sm z-0" />
      <div className="absolute inset-0 dark:hidden opacity-30"
        style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
      </button>

      <div className="w-full max-w-md z-10">
        {/* Logo & brand */}
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-5">
            <Logo className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Antigravity Financial</h1>
          <h2 className="text-sm font-light uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 dark:from-cyan-400 dark:via-blue-400 dark:to-cyan-400">
            Rising Against Gravity
          </h2>
        </div>

        <Card className="border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#0B1018]/80 backdrop-blur-xl shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              {stepTitle[step]}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              {stepDesc[step]}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* ── Step 1: Details ── */}
            {step === 'details' && (
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className={labelCls}>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className={`pl-10 ${inputCls}`} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className={labelCls}>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`pl-10 ${inputCls}`} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className={labelCls}>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className={`pl-10 pr-10 ${inputCls}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className={labelCls}>Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`pl-10 ${inputCls}`} />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-r dark:from-slate-700 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-500 text-white font-medium tracking-wide py-2.5 mt-2">
                  {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</span> : 'Continue to Verification'}
                </Button>

                <div className="mt-4 text-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <button type="button" onClick={() => router.push('/login')} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ── Step 2: KYC ── */}
            {step === 'kyc' && (
              <form onSubmit={handleKYCSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ssn" className={labelCls}>Social Security Number (SSN)</Label>
                  <Input id="ssn" type="password" placeholder="XXX-XX-XXXX" value={ssn} onChange={(e) => setSsn(e.target.value)} className={inputCls} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className={labelCls}>Date of Birth</Label>
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streetAddress" className={labelCls}>Street Address</Label>
                  <Input id="streetAddress" type="text" autoComplete="street-address" placeholder="123 Financial Ave" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className={labelCls}>City</Label>
                    <Input id="city" type="text" autoComplete="address-level2" placeholder="New York" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className={labelCls}>State / Region</Label>
                    <Input id="state" type="text" autoComplete="address-level1" placeholder="NY" value={regionState} onChange={(e) => setRegionState(e.target.value)} className={inputCls} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className={labelCls}>Country (Auto-detected)</Label>
                  <Input id="country" type="text" autoComplete="country-name" value={country} onChange={(e) => setCountry(e.target.value)} className={`${inputCls} font-medium text-emerald-600 dark:text-emerald-400`} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className={labelCls}>Mobile Number</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                </div>

                <div className="pt-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <p>Your data is encrypted end-to-end and strictly monitored by internal compliance systems.</p>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-gradient-to-r dark:from-emerald-600 dark:to-emerald-500 dark:hover:from-emerald-500 dark:hover:to-emerald-400 text-white font-medium tracking-wide py-2.5 mt-2">
                  {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Generating Code...</span> : 'Request OTP Verification'}
                </Button>

                <Button type="button" variant="ghost" onClick={() => setStep('details')} className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  Go Back
                </Button>
              </form>
            )}

            {/* ── Step 3: OTP ── */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="flex justify-center py-4">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} className="gap-2">
                    <InputOTPGroup className="gap-2">
                      {[0,1,2,3,4,5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="w-12 h-12 text-lg bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex flex-col gap-3">
                  <Button type="submit" disabled={isLoading || otp.length < 6} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-r dark:from-slate-700 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-500 text-white font-medium tracking-wide py-2.5">
                    {isLoading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</span> : 'Verify Code & Create Account'}
                  </Button>

                  <button type="button" onClick={handleResendOTP} disabled={resendCooldown > 0 || isLoading} className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-colors py-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>

                  <Button type="button" variant="ghost" onClick={() => { setStep('details'); setOtp(''); setError(''); }} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    Back to details
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
