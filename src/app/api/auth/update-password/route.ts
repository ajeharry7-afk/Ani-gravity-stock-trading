import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const body = await request.json();
  const email: string = body.email;
  const currentPassword: string = body.currentPassword;
  const newPassword: string = body.newPassword;

  if (!email || !currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Verify current password
  const { data: userRow, error } = await supabase
    .from('users')
    .select('password')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !userRow) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const match = await bcrypt.compare(currentPassword, userRow.password);
  if (!match) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  // Hash and store the new password
  const newHash = await bcrypt.hash(newPassword, 12);
  const { error: updateErr } = await supabase
    .from('users')
    .update({ password: newHash })
    .eq('email', email.toLowerCase());

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
