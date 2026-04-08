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

  // Look up the stored token
  const { data: token } = await supabase
    .from('otp_tokens')
    .select('otp_hash, expires_at')
    .eq('email', emailLower)
    .eq('type', 'login')
    .single();

  if (!token || token.otp_hash !== otpHash || new Date(token.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 401 });
  }

  // Delete token — one-time use
  await supabase.from('otp_tokens').delete().eq('email', emailLower).eq('type', 'login');

  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', emailLower)
    .single();

  if (userErr || !userRow) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const { data: holdings } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_email', emailLower);

  return NextResponse.json({
    user: {
      id: userRow.email,
      email: userRow.email,
      name: userRow.name,
      accountBalance: userRow.account_balance ?? 0,
      twoFactorEnabled: userRow.two_factor_enabled ?? false,
      createdAt: userRow.created_at,
    },
    holdings: (holdings ?? []).map((h: any) => ({
      id: h.id,
      symbol: h.symbol,
      companyName: h.company_name,
      shares: h.shares,
      purchasePrice: h.purchase_price,
      currentPrice: h.current_price,
      ownershipType: h.ownership_type,
      jointHolderName: h.joint_holder_name ?? undefined,
      purchaseDate: h.purchase_date,
      status: h.status,
    })),
  });
}
