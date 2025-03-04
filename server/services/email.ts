import nodemailer from 'nodemailer';

// Create a test account for development
const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

let transporter: nodemailer.Transporter;

export const initializeEmailService = async () => {
  // For development, use ethereal email (fake SMTP service)
  transporter = await createTestAccount();
  console.log('Email service initialized');
};

export const sendVerificationCode = async (to: string, code: string) => {
  if (!transporter) {
    await initializeEmailService();
  }

  const info = await transporter.sendMail({
    from: '"SAKANY Security" <security@sakany.com>',
    to,
    subject: "Your Two-Factor Authentication Code",
    text: `Your verification code is: ${code}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Two-Factor Authentication Code</h2>
        <p style="font-size: 24px; font-weight: bold; color: #333; padding: 20px; background-color: #f5f5f5; text-align: center; letter-spacing: 5px;">
          ${code}
        </p>
        <p>This code will expire in 5 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  });

  // Log the test email URL (only in development)
  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log("Preview URL: %s", previewUrl);

  return {
    ...info,
    previewUrl
  };
};