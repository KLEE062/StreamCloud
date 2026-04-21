import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP credentials missing');
  }

  console.log('Attempting to send email with config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD ? '****' + process.env.SMTP_PASSWORD.slice(-4) : 'MISSING'
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'StreamKloud'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Email sent successfully to:', options.email);
    console.log('Message ID:', info.messageId);
    if (process.env.SMTP_HOST?.includes('mailtrap')) {
      console.log('NOTE: You are using Mailtrap. Check your Mailtrap virtual inbox at https://mailtrap.io/inboxes');
    }
    return info;
  } catch (error) {
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('\n' + '='.repeat(60));
      console.error('SMTP AUTHENTICATION FAILED (535)');
      if (process.env.SMTP_HOST?.includes('gmail')) {
        console.error('DETECTED: Gmail SMTP usage.');
        console.error('FIX: You MUST use an "App Password", not your regular Gmail password.');
        console.error('1. Enable 2FA on your Google Account.');
        console.error('2. Go to Security > App Passwords.');
        console.error('3. Generate a password for "Other" and use that 16-character code.');
      } else if (process.env.SMTP_HOST?.includes('mailtrap')) {
        console.error('DETECTED: Mailtrap SMTP usage.');
        console.error('FIX: Verify your Username and Password from the Mailtrap dashboard.');
      }
      console.error('='.repeat(60) + '\n');
      throw new Error('Email authentication failed. Please check your SMTP credentials in Settings.');
    }
    throw error;
  }
};

export default sendEmail;
