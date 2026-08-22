import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import { sendWelcomeEmail, sendPasswordResetEmail } from "../server/services/emailService.js";

async function runEmailTest() {
  console.log("🚀 Starting SMTP Live Email Test...\n");
  console.log(`SMTP Host: ${process.env.SMTP_HOST || "Not Set (Fallback to Ethereal)"}`);
  console.log(`SMTP User: ${process.env.SMTP_USER || "Not Set"}\n`);

  const recipientEmail = process.env.SMTP_USER || "test@example.com";

  console.log(`1️⃣ Sending Live Welcome Credentials Email to ${recipientEmail}...`);
  const welcomeResult = await sendWelcomeEmail(
    recipientEmail,
    "RoyalKing99",
    "SecretPass123"
  );

  console.log(`\n2️⃣ Sending Live Password Reset OTP Email to ${recipientEmail}...`);
  const resetResult = await sendPasswordResetEmail(
    recipientEmail,
    "RoyalKing99",
    "849201"
  );

  console.log("\n✨ Live SMTP Email Test Completed!");
  if (welcomeResult?.previewUrl) {
    console.log(`📌 Ethereal Preview URL: ${welcomeResult.previewUrl}`);
  } else if (welcomeResult?.success) {
    console.log(`✅ Welcome Email delivered live to ${recipientEmail}!`);
  }
  if (resetResult?.previewUrl) {
    console.log(`📌 Ethereal Preview URL: ${resetResult.previewUrl}`);
  } else if (resetResult?.success) {
    console.log(`✅ Password Reset OTP Email delivered live to ${recipientEmail}!`);
  }
}

runEmailTest().catch(console.error);
