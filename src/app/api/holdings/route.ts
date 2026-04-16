import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('holdings')
    .select('*')
    .eq('user_email', email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((h: any) => ({
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
    }))
  );
}
