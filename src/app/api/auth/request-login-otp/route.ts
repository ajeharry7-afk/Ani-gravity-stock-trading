import { NextResponse } from 'next/server';
import { randomInt, createHash } from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase-server';

async function sendOTPEmail(toEmail: string, otp: string) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error('SMTP_USER or SMTP_PASS not configured');

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  await transporter.sendMail({
    from: `"Antigravity Financial" <${user}>`,
    to: toEmail,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;text-align:center;padding:20px;">
        <h2 style="color:#0f172a;">Antigravity Financial</h2>
        <p style="color:#475569;font-size:16px;">Your secure verification code is:</p>
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

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
  }

  const emailLower = email.toLowerCase();
  const supabase = getSupabaseAdmin();

  // Validate credentials against Supabase — same flow for all users including admin
  const { data: userRow, error } = await supabase
    .from('users')
    .select('password, blocked')
    .eq('email', emailLower)
    .single();

  if (error || !userRow) {
    return NextResponse.json({ error: 'Invalid email or password. Please try again.' }, { status: 401 });
  }
  if (userRow.blocked) {
    return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
  }
  const passwordMatch = await bcrypt.compare(password, userRow.password);
  if (!passwordMatch) {
    return NextResponse.json({ error: 'Invalid email or password. Please try again.' }, { status: 401 });
  }

  // Generate cryptographically-random 6-digit OTP
  const otp = String(randomInt(100000, 999999));
  const otpHash = createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Upsert token (replaces any previous pending login OTP for this email)
  const { error: upsertErr } = await supabase.from('otp_tokens').upsert(
    { email: emailLower, type: 'login', otp_hash: otpHash, expires_at: expiresAt, data: null },
    { onConflict: 'email,type' }
  );
  if (upsertErr) {
    console.error('OTP upsert error:', upsertErr);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }

  // Send email — fail loudly so the client knows
  try {
    await sendOTPEmail(emailLower, otp);
  } catch (err) {
    console.error('OTP email send failed:', err);
    return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
