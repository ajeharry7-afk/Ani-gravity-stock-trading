import { NextResponse } from 'next/server';
import { randomInt, createHash } from 'crypto';
import nodemailer from 'nodemailer';
import { getSupabaseAdmin } from '@/lib/supabase-server';

async function sendOTPEmail(toEmail: string, otp: string) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error('SMTP_USER or SMTP_PASS not configured');

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  await transporter.sendMail({
    from: `"Antigravity Financial" <${user}>`,
    to: toEmail,
    subject: 'Verify your Antigravity account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;text-align:center;padding:20px;">
        <h2 style="color:#0f172a;">Antigravity Financial</h2>
        <p style="color:#475569;font-size:16px;">Your account verification code is:</p>
        <div style="margin:20px 0;">
          <span style="font-size:32px;font-weight:bold;padding:12px 24px;background:#f8fafc;border:2px solid #e2e8f0;border-radius:8px;color:#0ea5e9;letter-spacing:4px;">${otp}</span>
        </div>
        <p style="color:#64748b;font-size:14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const email: string = body.email;
  const password: string = body.password;
  const name: string = body.name;
  const kycData = body.kycData ?? null;

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const emailLower = email.toLowerCase();
  const supabase = getSupabaseAdmin();

  // Check if email is already taken
  const { data: existing } = await supabase
    .from('users')
    .select('email')
    .eq('email', emailLower)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  // Generate OTP
  const otp = String(randomInt(100000, 999999));
  const otpHash = createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Store token with pending signup data
  const { error: upsertErr } = await supabase.from('otp_tokens').upsert(
    {
      email: emailLower,
      type: 'signup',
      otp_hash: otpHash,
      expires_at: expiresAt,
      data: { name, password, kycData },
    },
    { onConflict: 'email,type' }
  );

  if (upsertErr) {
    console.error('OTP upsert error:', upsertErr);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }

  try {
    await sendOTPEmail(emailLower, otp);
  } catch (err) {
    console.error('OTP email send failed:', err);
    return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
