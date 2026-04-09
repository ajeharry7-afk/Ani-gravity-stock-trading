'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  CreditCard, 
  Bitcoin, 
  ArrowLeft, 
  CheckCircle, 
  Shield, 
  Clock,
  Mail,
  User,
  Users,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import type { PaymentMethod } from '@/types';


const paymentMethods = [
  {
    id: 'wire' as PaymentMethod,
    name: 'Wire Transfer',
    description: 'Direct bank-to-bank transfer',
    icon: Building2,
    processingTime: '1-2 business days',
    fee: '$25',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
  },
  {
    id: 'ach' as PaymentMethod,
    name: 'ACH Payment',
    description: 'Electronic bank transfer',
    icon: Building2,
    processingTime: '3-5 business days',
    fee: 'Free',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
  },
  {
    id: 'credit_card' as PaymentMethod,
    name: 'Credit Card',
    description: 'Pay with Visa, Mastercard, Amex',
    icon: CreditCard,
    processingTime: 'Instant',
    fee: '2.9% + $0.30',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-400',
  },
  {
    id: 'crypto' as PaymentMethod,
    name: 'Cryptocurrency',
    description: 'Pay with BTC, ETH, USDC',
    icon: Bitcoin,
    processingTime: '10-60 minutes',
    fee: 'Network fee only',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-400',
  },
];

export function PaymentMethodView() {
  const router = useRouter();
  const { pendingPurchase, completePurchaseWithPayment, user } = useAuthStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleCompletePurchase = async () => {
    if (!selectedMethod) return;
    
    setIsProcessing(true);
    const purchaseResult = await completePurchaseWithPayment(selectedMethod);
    setResult(purchaseResult);
    setIsProcessing(false);
    
    if (purchaseResult.success) {
      setTimeout(() => {
        router.push('/portfolio');
      }, 3000);
    }
  };

  if (!pendingPurchase) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Pending Purchase</h2>
          <p className="text-slate-400 mb-4">You don't have any pending purchases.</p>
          <Button onClick={() => router.push('/market')} className="bg-emerald-500 hover:bg-emerald-600">
            Go to Market
          </Button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className={`w-20 h-20 rounded-full ${result.success ? 'bg-emerald-500/20' : 'bg-red-500/20'} flex items-center justify-center mx-auto mb-6`}>
            {result.success ? (
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            ) : (
              <AlertCircle className="w-10 h-10 text-red-400" />
            )}
          </div>
          <h2 className={`text-2xl font-bold ${result.success ? 'text-white' : 'text-red-400'} mb-2`}>
            {result.success ? 'Purchase Initiated!' : 'Purchase Failed'}
          </h2>
          <p className="text-slate-400 mb-2 max-w-md mx-auto">{result.message}</p>
          {result.success && (
            <div className="flex flex-col items-center justify-center gap-3 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
                <Mail className="w-4 h-4" />
                <span>App owner has been notified via email</span>
              </div>
              <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center max-w-sm">
                You will receive another notification as soon as your payment has been processed and your account is updated.
              </p>
            </div>
          )}
          <Button onClick={() => router.push('/portfolio')} className="bg-emerald-500 hover:bg-emerald-600">
            {result.success ? 'View Portfolio' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => router.push('/market')}
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white">Select Payment Method</h2>
          <p className="text-slate-400">Choose how you want to pay for your purchase</p>
        </div>
      </div>

      {/* Order Summary */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Stock</span>
                <span className="font-semibold text-white">{pendingPurchase.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Company</span>
                <span className="text-white">{pendingPurchase.companyName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Shares</span>
                <span className="text-white">{pendingPurchase.shares}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Price per share</span>
                <span className="text-white">{formatCurrency(pendingPurchase.pricePerShare)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ownership</span>
                <div className="flex items-center gap-2">
                  {pendingPurchase.ownershipType === 'individual' ? (
                    <User className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Users className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="text-white capitalize">{pendingPurchase.ownershipType}</span>
                </div>
              </div>
              {pendingPurchase.jointHolderName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Joint with</span>
                  <span className="text-white">{pendingPurchase.jointHolderName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Purchaser</span>
                <span className="text-white">{user?.email}</span>
              </div>
              <div className="border-t border-slate-700 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">Total</span>
                  <span className="text-2xl font-bold text-emerald-400">{formatCurrency(pendingPurchase.totalCost)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                isSelected 
                  ? `border-${method.textColor.split('-')[1]}-500 bg-gradient-to-br ${method.color.replace('from-', 'from-').replace('to-', 'to-')}/10` 
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className={`w-5 h-5 ${method.textColor}`} />
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${method.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${method.textColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{method.name}</h3>
                  <p className="text-sm text-slate-400 mb-3">{method.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {method.processingTime}
                    </Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                      Fee: {method.fee}
                    </Badge>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Security Note */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
        <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <p className="text-sm text-slate-400">
          <span className="text-slate-300 font-medium">Secure Payment:</span> All transactions are encrypted and secure. 
          The app owner will be notified via email once you complete this purchase.
        </p>
      </div>

      {/* Complete Button */}
      <Button
        onClick={handleCompletePurchase}
        disabled={!selectedMethod || isProcessing}
        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-4 text-lg"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing Payment...
          </span>
        ) : selectedMethod ? (
          <>
            <DollarSign className="w-5 h-5 mr-2" />
            Complete Purchase with {paymentMethods.find(m => m.id === selectedMethod)?.name}
          </>
        ) : (
          'Select a Payment Method'
        )}
      </Button>
    </div>
  );
}
