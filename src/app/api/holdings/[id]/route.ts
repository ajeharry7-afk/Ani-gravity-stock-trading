import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { id } = await params;
  const { status, userEmail } = await request.json();

  const { error } = await supabaseAdmin
    .from('holdings')
    .update({ status })
    .eq('id', id)
    .eq('user_email', userEmail);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
