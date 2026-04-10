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

const paymentMethodLabels: Record<string, string> = {
  wire: 'Wire Transfer',
  ach: 'ACH Payment',
  credit_card: 'Credit Card',
  crypto: 'Cryptocurrency',
};

export async function POST(request: Request) {
  const { userEmail, purchase, paymentMethod } = await request.json();

  if (!userEmail || !purchase) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0c121a; padding: 20px; color: white;">
        <h2>New Payment Alert</h2>
      </div>
      <div style="padding: 20px;">
        <p><strong>User:</strong> ${userEmail}</p>
        <p><strong>Stock:</strong> ${purchase.symbol} (${purchase.companyName})</p>
        <p><strong>Shares:</strong> ${purchase.shares}</p>
        <p><strong>Price per share:</strong> $${Number(purchase.pricePerShare).toFixed(2)}</p>
        <p><strong>Total amount:</strong> $${Number(purchase.totalCost).toFixed(2)}</p>
        <p><strong>Payment method:</strong> ${paymentMethodLabels[paymentMethod] ?? paymentMethod}</p>
        <p><strong>Ownership:</strong> ${purchase.ownershipType}${purchase.jointHolderName ? ` (with ${purchase.jointHolderName})` : ''}</p>
      </div>
    </div>
  `;

  try {
    const adminEmail = process.env.SMTP_USER || 'patriciakalcik@gmail.com';
    await sendEmailViaSMTP(
      adminEmail,
      `New Stock Purchase Order - ${purchase.symbol} by ${userEmail}`,
      htmlBody
    );
    return NextResponse.json({ success: true, message: 'Admin notified!' });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send notification' },
      { status: 500 }
    );
  }
}
