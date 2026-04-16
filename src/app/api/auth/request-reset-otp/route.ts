import { NextResponse } from 'next/server';
import { randomInt, createHash } from 'crypto';
import nodemailer from 'nodemailer';
import { getSupabaseAdmin } from '@/lib/supabase-server';

async function sendResetEmail(toEmail: string, otp: string) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error('SMTP_USER or SMTP_PASS not configured');

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  await transporter.sendMail({
    from: `"Antigravity Financial" <${user}>`,
    to: toEmail,
    subject: 'Reset your Antigravity password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;text-align:center;padding:20px;">
        <h2 style="color:#0f172a;">Antigravity Financial</h2>
        <p style="color:#475569;font-size:16px;">Your password reset code is:</p>
        <div style="margin:20px 0;">
          <span style="font-size:32px;font-weight:bold;padding:12px 24px;background:#f8fafc;border:2px solid #e2e8f0;border-radius:8px;color:#0ea5e9;letter-spacing:4px;">${otp}</span>
        </div>
        <p style="color:#64748b;font-size:14px;">This code expires in 10 minutes. If you didn't request a password reset, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const email: string = body.email;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const emailLower = email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Check account exists — return same message regardless to prevent enumeration
  const { data: userRow } = await supabase
    .from('users')
    .select('email')
    .eq('email', emailLower)
    .single();

  if (!userRow) {
    // Still return success to avoid revealing whether the email is registered
    return NextResponse.json({ success: true });
  }

  const otp = String(randomInt(100000, 999999));
  const otpHash = createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: upsertErr } = await supabase.from('otp_tokens').upsert(
    { email: emailLower, type: 'reset', otp_hash: otpHash, expires_at: expiresAt, data: null },
    { onConflict: 'email,type' }
  );

  if (upsertErr) {
    console.error('Reset OTP upsert error:', upsertErr);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }

  try {
    await sendResetEmail(emailLower, otp);
  } catch (err) {
    console.error('Reset email send failed:', err);
    return NextResponse.json({ error: 'Failed to send reset code. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
