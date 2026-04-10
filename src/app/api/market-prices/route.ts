import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('market_price_overrides')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function PATCH(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { symbol, price } = await request.json();

  if (!symbol || price === undefined) {
    return NextResponse.json({ error: 'symbol and price required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('market_price_overrides')
    .upsert({ symbol, price, updated_at: new Date().toISOString() }, { onConflict: 'symbol' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
