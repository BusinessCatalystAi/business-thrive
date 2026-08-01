// Business Thrive — contact form backend
// Receives form submissions from the website and auto-emails the details
// to paroksh@businessthrive.in via SMTP (nodemailer).

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- middleware ----------
app.use(express.json());

// Only allow requests from your own site(s). Add more origins if needed
// (e.g. a staging URL) as a comma-separated list in ALLOWED_ORIGINS.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Basic abuse protection: 10 submissions per 15 minutes per IP.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions from this device. Please try again later.' }
});

// ---------- mailer ----------
// Works with Gmail (use an App Password, not your normal password) or any
// other SMTP provider — just change SMTP_HOST/PORT/SECURE accordingly.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false', // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const LEAD_RECIPIENT = process.env.LEAD_RECIPIENT || 'paroksh@businessthrive.in';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---------- routes ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'business-thrive-backend' });
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, company, email, phone, need, message, website } = req.body || {};

    // Honeypot field — real visitors never fill this hidden input.
    // If it's filled, silently pretend success and drop the submission.
    if (website) {
      return res.json({ ok: true });
    }

    if (!name || !company || !email) {
      return res.status(400).json({ ok: false, error: 'Name, company and email are required.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ ok: false, error: 'Please provide a valid email address.' });
    }

    const subject = `New Growth Plan Request — ${company}`;

    const text =
`New lead from the Business Thrive website:

Name: ${name}
Company: ${company}
Email: ${email}
Phone / WhatsApp: ${phone || '—'}
Interested in: ${need || '—'}

Message:
${message || '—'}`;

    const html = `
      <h2 style="font-family:sans-serif;">New Growth Plan Request</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;color:#555;">Name</td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#555;">Company</td><td>${escapeHtml(company)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#555;">Email</td><td>${escapeHtml(email)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#555;">Phone / WhatsApp</td><td>${escapeHtml(phone || '—')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#555;">Interested in</td><td>${escapeHtml(need || '—')}</td></tr>
      </table>
      <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;"><strong>Message:</strong><br>${escapeHtml(message || '—')}</p>
    `;

    await transporter.sendMail({
      from: `"Business Thrive Website" <${process.env.SMTP_USER}>`,
      to: LEAD_RECIPIENT,
      replyTo: email,
      subject,
      text,
      html
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ ok: false, error: 'Something went wrong sending your message. Please try again or email us directly.' });
  }
});

app.listen(PORT, () => {
  console.log(`Business Thrive backend running on port ${PORT}`);
});
