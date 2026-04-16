import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const body = await request.json();
  const email: string = body.email;
  const otp: string = body.otp;
  const newPassword: string = body.newPassword;

  if (!email || !otp || !newPassword) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const emailLower = email.toLowerCase();
  const otpHash = createHash('sha256').update(otp).digest('hex');
  const supabase = getSupabaseAdmin();

  const { data: tokenRow, error: tokenErr } = await supabase
    .from('otp_tokens')
    .select('otp_hash, expires_at')
    .eq('email', emailLower)
    .eq('type', 'reset')
    .single();

  if (tokenErr || !tokenRow) {
    return NextResponse.json({ error: 'Invalid or expired reset code.' }, { status: 400 });
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Reset code has expired. Please request a new one.' }, { status: 400 });
  }

  if (tokenRow.otp_hash !== otpHash) {
    return NextResponse.json({ error: 'Invalid reset code. Please check and try again.' }, { status: 400 });
  }

  // Hash new password and update user
  const passwordHash = await bcrypt.hash(newPassword, 12);

  const { error: updateErr } = await supabase
    .from('users')
    .update({ password: passwordHash })
    .eq('email', emailLower);

  if (updateErr) {
    console.error('Password update error:', updateErr);
    return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });
  }

  // Delete the used token
  await supabase.from('otp_tokens').delete().eq('email', emailLower).eq('type', 'reset');

  return NextResponse.json({ success: true });
}
