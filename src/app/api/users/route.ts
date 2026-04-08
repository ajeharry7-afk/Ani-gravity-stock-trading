import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'antigravityfinancial@gmail.com').toLowerCase();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requester = searchParams.get('requester')?.toLowerCase();
  if (requester !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, holdings(*)')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Supabase GET /users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.json();
  const email = (body.email as string)?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const { holdings, ...userData } = body;

  // Upsert user record
  const { error: userError } = await supabaseAdmin
    .from('users')
    .upsert({
      email,
      name: userData.name || userData.user?.name,
      password: userData.password,
      account_balance: userData.accountBalance ?? undefined,
      two_factor_enabled: userData.twoFactorEnabled ?? userData.user?.twoFactorEnabled ?? false,
      kyc_data: userData.kycData ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

  if (userError) {
    console.error('Supabase upsert user error:', userError);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Sync holdings if provided
  if (Array.isArray(holdings) && holdings.length > 0) {
    // Delete existing holdings and re-insert (simplest sync strategy)
    await supabaseAdmin.from('holdings').delete().eq('user_email', email);

    const holdingsRows = holdings.map((h: any) => ({
      id: h.id,
      user_email: email,
      symbol: h.symbol,
      company_name: h.companyName,
      shares: h.shares,
      purchase_price: h.purchasePrice,
      current_price: h.currentPrice,
      ownership_type: h.ownershipType,
      joint_holder_name: h.jointHolderName ?? null,
      purchase_date: h.purchaseDate,
      status: h.status ?? 'completed',
    }));

    const { error: holdingsError } = await supabaseAdmin
      .from('holdings')
      .upsert(holdingsRows, { onConflict: 'id' });

    if (holdingsError) {
      console.error('Supabase upsert holdings error:', holdingsError);
    }
  }

  return NextResponse.json({ success: true });
}
