import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

async function sendEmailViaSMTP(toEmail: string, subject: string, htmlContent: string) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('Missing SMTP_USER or SMTP_PASS in .env');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return transporter.sendMail({
    from: `"Antigravity Financial" <${user}>`,
    to: toEmail,
    subject,
    html: htmlContent,
  });
}

export async function POST(request: Request) {
  const { email, otp } = await request.json();

  if (!email || !otp) {
    return NextResponse.json({ error: 'Missing email or OTP' }, { status: 400 });
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center; padding: 20px;">
      <h2 style="color: #0f172a;">Antigravity Financial</h2>
      <p style="color: #475569; font-size: 16px;">Your secure verification code is:</p>
      <div style="margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; padding: 12px 24px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; color: #0ea5e9; letter-spacing: 4px;">
          ${otp}
        </span>
      </div>
      <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
    </div>
  `;

  try {
    await sendEmailViaSMTP(email, 'Your Verification Code', htmlBody);
    return NextResponse.json({ success: true, message: 'Email sent!' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
