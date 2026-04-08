import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const body = await request.json();
  const email: string = body.email;
  const otp: string = body.otp;

  if (!email || !otp) {
    return NextResponse.json({ error: 'Missing email or OTP' }, { status: 400 });
  }

  const emailLower = email.toLowerCase();
  const supabase = getSupabaseAdmin();
  const otpHash = createHash('sha256').update(otp).digest('hex');

  const { data: token } = await supabase
    .from('otp_tokens')
    .select('otp_hash, expires_at, data')
    .eq('email', emailLower)
    .eq('type', 'signup')
    .single();

  if (!token || token.otp_hash !== otpHash || new Date(token.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 401 });
  }

  const { name, password, kycData } = token.data as { name: string; password: string; kycData: any };

  // Create user in Supabase
  const { error: insertErr } = await supabase.from('users').insert({
    email: emailLower,
    name,
    password,
    kyc_data: kycData ?? null,
    account_balance: 0,
  });

  if (insertErr) {
    // Handle race condition where another request already created the user
    if (insertErr.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    console.error('User insert error:', insertErr);
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }

  // Delete token — one-time use
  await supabase.from('otp_tokens').delete().eq('email', emailLower).eq('type', 'signup');

  return NextResponse.json({
    user: {
      id: emailLower,
      email: emailLower,
      name,
      accountBalance: 0,
      createdAt: new Date().toISOString(),
    },
  });
}
