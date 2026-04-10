import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('user_notifications')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { userEmail, title, message, type } = await request.json();

  const { error } = await supabaseAdmin
    .from('user_notifications')
    .insert({ user_email: userEmail.toLowerCase(), title, message, type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
