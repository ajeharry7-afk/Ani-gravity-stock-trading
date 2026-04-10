'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Logo } from '@/components/ui/Logo';

export function SignupForm() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<'details' | 'kyc' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // KYC fields
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
  
  const requestSignupOTP = useAuthStore((state) => state.requestSignupOTP);
  const verifySignupOTP = useAuthStore((state) => state.verifySignupOTP);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (step === 'kyc') {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.country_name) setCountry(data.country_name);
          if (data.city && !city) setCity(data.city);
          if (data.region && !regionState) setRegionState(data.region);
        })
        .catch(() => setCountry('United States')); // safe fallback
    }
  }, [step]);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    // Simulate a brief validation delay
    await new Promise(r => setTimeout(r, 500));
    setStep('kyc');
    setIsLoading(false);
  };

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!ssn || !dob || !streetAddress || !city || !country || !phone) {
      setError('Please provide all the necessary verification details to securely comply with financial regulations.');
      return;
    }

    const fullAddress = `${streetAddress}, ${city}, ${regionState ? regionState + ',' : ''} ${country}`;

    setIsLoading(true);
    const success = await requestSignupOTP(email, password, name, { ssn, dob, address: fullAddress, phone });
    if (!success) {
      setError('An account with this email already exists or the operation failed.');
      setIsLoading(false);
    } else {
      setStep('otp');
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setIsLoading(true);
    const success = await verifySignupOTP(email, otp);
    if (!success) {
      setError('Invalid or expired verification code. Please try again.');
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0C121A] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] p-4" style={{ backgroundImage: 'radial-gradient(circle at top right, #1b2735 0%, #0c121a 100%)' }}>
        <div className="absolute inset-0 bg-[#0C121A]/40 backdrop-blur-sm z-0"></div>
        <div className="w-full max-w-md z-10">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <Logo className="w-20 h-20" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Antigravity Financial</h1>
            <h2 className="text-sm font-light uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400">Rising Against Gravity</h2>
          </div>

          <Card className="border-slate-700/50 bg-[#0B1018]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
              <p className="text-slate-400 mb-6">
                Welcome to Antigravity, {name}! Your portfolio is ready.
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium tracking-wide border border-slate-600/50"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C121A] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] p-4" style={{ backgroundImage: 'radial-gradient(circle at top right, #1b2735 0%, #0c121a 100%)' }}>
      <div className="absolute inset-0 bg-[#0C121A]/40 backdrop-blur-sm z-0"></div>
      <div className="w-full max-w-md z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex justify-center mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <Logo className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Antigravity Financial</h1>
          <h2 className="text-sm font-light uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400">Rising Against Gravity</h2>
        </div>

        <Card className="border-slate-700/50 bg-[#0B1018]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">
              {step === 'details' ? 'Create account' : step === 'kyc' ? 'Identity Verification' : 'Verify your email'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 'details' 
                ? 'Start tracking your investments today'
                : step === 'kyc'
                ? 'Financial regulations require us to verify your identity'
                : `We've sent a 6-digit verification code to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400 mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'details' ? (
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

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
                      placeholder="Create a password (min 6 chars)"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium tracking-wide py-2.5 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-slate-600/50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Continue to Verification'
                    )}
                  </Button>
                </form>
              ) : step === 'kyc' ? (
                <form onSubmit={handleKYCSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ssn" className="text-slate-300">Social Security Number (SSN)</Label>
                    <Input
                      id="ssn"
                      type="password"
                      placeholder="XXX-XX-XXXX"
                      value={ssn}
                      onChange={(e) => setSsn(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-slate-300">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="streetAddress" className="text-slate-300">Street Address</Label>
                    <Input
                      id="streetAddress"
                      type="text"
                      autoComplete="street-address"
                      placeholder="123 Financial Ave"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-slate-300">City</Label>
                      <Input
                        id="city"
                        type="text"
                        autoComplete="address-level2"
                        placeholder="New York"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-slate-300">State / Region</Label>
                      <Input
                        id="state"
                        type="text"
                        autoComplete="address-level1"
                        placeholder="NY"
                        value={regionState}
                        onChange={(e) => setRegionState(e.target.value)}
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-slate-300">Country (Auto-detected)</Label>
                    <Input
                      id="country"
                      type="text"
                      autoComplete="country-name"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 font-medium text-emerald-400 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Mobile Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>
  
                  <div className="pt-2 text-xs text-slate-400 bg-slate-900/30 p-3 rounded-lg border border-slate-800 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p>Your data is encrypted end-to-end and strictly monitored by internal compliance systems.</p>
                  </div>
  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium tracking-wide py-2.5 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-500/50 mt-4"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Generating Code...
                      </span>
                    ) : (
                      'Request OTP Verification'
                    )}
                  </Button>
  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('details')}
                    className="w-full text-slate-400 hover:text-white"
                  >
                    Go Back
                  </Button>
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
                      'Verify Code & Create Account'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep('details');
                      setOtp('');
                      setError('');
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    Back to details
                  </Button>
                </div>
              </form>
            )}

            {step === 'details' && (
              <div className="mt-6 text-center">
                <p className="text-slate-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => router.push('/login')}
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
