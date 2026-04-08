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
  const { name, email, kycData } = await request.json();

  if (!name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const rawSsn: string = kycData?.ssn || '';
  const ssnDisplay = rawSsn.length >= 4 ? `***-**-${rawSsn.slice(-4)}` : '****';
  const dob = kycData?.dob || 'N/A';
  const address = kycData?.address || 'N/A';
  const phone = kycData?.phone || 'N/A';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0ea5e9; padding: 20px; color: white;">
        <h2 style="margin: 0;">New User Registration & KYC</h2>
      </div>
      <div style="padding: 20px;">
        <h3 style="color: #0f172a; margin-top: 0;">Account Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <h3 style="color: #0f172a;">KYC Verification Data</h3>
        <p><strong>SSN:</strong> ${ssnDisplay}</p>
        <p><strong>Date of Birth:</strong> ${dob}</p>
        <p><strong>House Address:</strong> ${address}</p>
        <p><strong>Mobile Number:</strong> ${phone}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 14px;">A new user has successfully completed OTP verification and submitted their KYC details for admin review.</p>
      </div>
    </div>
  `;

  try {
    const adminEmail = process.env.SMTP_USER || 'patriciakalcik@gmail.com';
    await sendEmailViaSMTP(adminEmail, `New User Sign Up - ${name}`, htmlBody);
    return NextResponse.json({ success: true, message: 'Admin notified!' });
  } catch (error) {
    console.error('Error sending signup notification:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send notification' },
      { status: 500 }
    );
  }
}
