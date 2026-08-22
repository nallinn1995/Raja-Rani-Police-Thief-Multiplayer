import nodemailer from "nodemailer";

let fallbackTestTransporter = null;

const getEtherealTransporter = async () => {
  if (!fallbackTestTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      fallbackTestTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`\n📧 [FALLBACK LOCAL TEST MODE INITIALIZED]`);
      console.log(`Ethereal Test User: ${testAccount.user}\n`);
    } catch (err) {
      console.error("Failed to create Ethereal test account:", err);
      return null;
    }
  }
  return fallbackTestTransporter;
};

// Configure SMTP transport (Real SMTP from .env or Ethereal Test Account for local testing)
const getTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Real SMTP provided in .env
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback to Ethereal Test SMTP for Local Testing
  return await getEtherealTransporter();
};

export const sendWelcomeEmail = async (email, username, password) => {
  if (!email) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Raja Rani Police Thief</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #080320; margin: 0; padding: 0; color: #F1ECEC; }
        .container { max-width: 600px; margin: 20px auto; background: linear-gradient(180deg, #14072E 0%, #080320 100%); border: 1px solid #782287; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(120, 34, 135, 0.4); }
        .header { background: linear-gradient(90deg, #21073F 0%, #3F1152 50%, #21073F 100%); padding: 30px 20px; text-align: center; border-bottom: 2px solid #FBE278; }
        .header h1 { color: #FBE278; font-size: 26px; margin: 0; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
        .header p { color: #AC41D7; font-size: 13px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 30px 25px; line-height: 1.6; }
        .greeting { font-size: 20px; font-weight: bold; color: #FBE278; margin-bottom: 15px; }
        .credentials-box { background-color: #21073F; border: 1px solid #AC41D7; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: inset 0 0 15px rgba(172,65,215,0.2); }
        .cred-item { margin-bottom: 12px; font-size: 15px; }
        .cred-item:last-child { margin-bottom: 0; }
        .cred-label { color: #C2A6B9; font-weight: bold; display: inline-block; width: 110px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
        .cred-value { color: #FFFFFF; font-weight: bold; font-family: monospace; font-size: 16px; background: #080320; padding: 4px 10px; border-radius: 6px; border: 1px solid #3F1152; }
        .security-note { background: rgba(235, 156, 9, 0.15); border-left: 4px solid #EB9C09; padding: 12px 15px; border-radius: 6px; font-size: 13px; color: #FBE278; margin-top: 20px; }
        .btn-container { text-align: center; margin: 30px 0 10px 0; }
        .btn { background: linear-gradient(90deg, #EB9C09 0%, #F9C933 50%, #EB9C09 100%); color: #080320 !important; font-weight: 900; font-size: 16px; text-decoration: none; padding: 14px 36px; border-radius: 50px; display: inline-block; box-shadow: 0 0 20px rgba(249, 201, 51, 0.6); text-transform: uppercase; letter-spacing: 1px; }
        .footer { background-color: #050215; text-align: center; padding: 20px; font-size: 12px; color: #78779C; border-top: 1px solid #3F1152; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👑 Raja Rani Police Thief</h1>
          <p>The Ultimate Game of Wit & Deception</p>
        </div>
        <div class="content">
          <div class="greeting">Welcome to the Kingdom, ${username}!</div>
          <p>Thank you for creating an account. Below are your official login credentials saved for your future reference:</p>
          
          <div class="credentials-box">
            <div class="cred-item">
              <span class="cred-label">Username:</span>
              <span class="cred-value">${username}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Password:</span>
              <span class="cred-value">${password}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Email:</span>
              <span class="cred-value">${email}</span>
            </div>
          </div>

          <div class="security-note">
            🔒 <strong>Security Tip:</strong> Keep these credentials private and safe. Never share your password with anyone.
          </div>

          <div class="btn-container">
            <a href="http://localhost:5173" class="btn">Play Now</a>
          </div>
        </div>
        <div class="footer">
          © 2026 Raja Rani Police Thief. All rights reserved.<br>Made with ❤️ for '90s kids.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = await getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || "Raja Rani Game"}" <${process.env.SMTP_USER || "noreply@rajarani.com"}>`,
          to: email,
          subject: "👑 Welcome to Raja Rani Police Thief - Your Login Credentials",
          html: htmlContent,
        });

        console.log(`\n✉️ Welcome email sent to: ${email}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`🔗 LIVE EMAIL PREVIEW URL: ${previewUrl}\n`);
        }
        return { success: true, previewUrl };
      } catch (sendErr) {
        console.warn(`⚠️ Custom SMTP failed (${sendErr.message}). Retrying via Ethereal fallback...`);
        const fallbackTransporter = await getEtherealTransporter();
        if (fallbackTransporter) {
          const info = await fallbackTransporter.sendMail({
            from: `"Raja Rani Game" <noreply@rajarani.com>`,
            to: email,
            subject: "👑 Welcome to Raja Rani Police Thief - Your Login Credentials",
            html: htmlContent,
          });
          const previewUrl = nodemailer.getTestMessageUrl(info);
          console.log(`\n✉️ Welcome email sent via Fallback Test Mode to: ${email}`);
          if (previewUrl) {
            console.log(`🔗 LIVE EMAIL PREVIEW URL: ${previewUrl}\n`);
          }
          return { success: true, previewUrl };
        }
      }
    }
  } catch (err) {
    console.error("❌ Error sending welcome email:", err);
  }
};

export const sendPasswordResetEmail = async (email, username, otpCode) => {
  if (!email) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset - Raja Rani Police Thief</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #080320; margin: 0; padding: 0; color: #F1ECEC; }
        .container { max-width: 600px; margin: 20px auto; background: linear-gradient(180deg, #14072E 0%, #080320 100%); border: 1px solid #782287; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(120, 34, 135, 0.4); }
        .header { background: linear-gradient(90deg, #21073F 0%, #3F1152 50%, #21073F 100%); padding: 30px 20px; text-align: center; border-bottom: 2px solid #FBE278; }
        .header h1 { color: #FBE278; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 30px 25px; line-height: 1.6; text-align: center; }
        .greeting { font-size: 18px; font-weight: bold; color: #FBE278; margin-bottom: 15px; }
        .otp-box { background: #21073F; border: 2px gold solid; border-color: #FBE278; border-radius: 16px; padding: 20px; margin: 25px auto; width: 220px; box-shadow: 0 0 25px rgba(251, 226, 120, 0.4); }
        .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #FBE278; font-family: monospace; }
        .warning { font-size: 13px; color: #C2A6B9; margin-top: 15px; }
        .footer { background-color: #050215; text-align: center; padding: 20px; font-size: 12px; color: #78779C; border-top: 1px solid #3F1152; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${username},</div>
          <p>We received a request to reset your password for your <strong>Raja Rani Police Thief</strong> account.</p>
          <p>Use the 6-digit verification code below to reset your password:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
          </div>

          <p class="warning">⚠️ This verification code is valid for <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          © 2026 Raja Rani Police Thief. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = await getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || "Raja Rani Game"}" <${process.env.SMTP_USER || "noreply@rajarani.com"}>`,
          to: email,
          subject: "🔐 Password Reset Code - Raja Rani Police Thief",
          html: htmlContent,
        });

        console.log(`\n✉️ Password reset OTP email sent to: ${email}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`🔗 LIVE EMAIL PREVIEW URL: ${previewUrl}\n`);
        }
        return { success: true, previewUrl };
      } catch (sendErr) {
        console.warn(`⚠️ Custom SMTP failed (${sendErr.message}). Retrying via Ethereal fallback...`);
        const fallbackTransporter = await getEtherealTransporter();
        if (fallbackTransporter) {
          const info = await fallbackTransporter.sendMail({
            from: `"Raja Rani Game" <noreply@rajarani.com>`,
            to: email,
            subject: "🔐 Password Reset Code - Raja Rani Police Thief",
            html: htmlContent,
          });
          const previewUrl = nodemailer.getTestMessageUrl(info);
          console.log(`\n✉️ Password reset OTP email sent via Fallback Test Mode to: ${email}`);
          if (previewUrl) {
            console.log(`🔗 LIVE EMAIL PREVIEW URL: ${previewUrl}\n`);
          }
          return { success: true, previewUrl };
        }
      }
    }
  } catch (err) {
    console.error("❌ Error sending password reset email:", err);
  }
};
