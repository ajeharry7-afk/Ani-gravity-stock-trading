import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email).toLowerCase();

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, holdings(*)')
    .eq('email', decodedEmail)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(null); // user not found
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'antigravityfinancial@gmail.com').toLowerCase();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email).toLowerCase();
  const body = await request.json();

  // Admin-only fields require admin identity
  const adminOnlyFields = ['blocked', 'kycData', 'accountBalance'];
  const touchesAdminField = adminOnlyFields.some((f) => body[f] !== undefined);
  if (touchesAdminField && body.adminEmail?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.accountBalance !== undefined) updates.account_balance = body.accountBalance;
  if (body.twoFactorEnabled !== undefined) updates.two_factor_enabled = body.twoFactorEnabled;
  if (body.kycData !== undefined) updates.kyc_data = body.kycData;
  if (body.blocked !== undefined) updates.blocked = body.blocked;

  const { error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('email', decodedEmail);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
