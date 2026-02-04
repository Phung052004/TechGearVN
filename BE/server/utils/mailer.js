const nodemailer = require("nodemailer");

function getEnv(name) {
  const value = (process.env[name] ?? "").trim();
  return value.length > 0 ? value : null;
}

function createTransport() {
  const host = getEnv("SMTP_HOST");
  const portRaw = getEnv("SMTP_PORT");
  const user = getEnv("SMTP_USER");
  const pass = getEnv("SMTP_PASS");

  if (!host || !portRaw || !user || !pass) {
    const missing = [
      !host ? "SMTP_HOST" : null,
      !portRaw ? "SMTP_PORT" : null,
      !user ? "SMTP_USER" : null,
      !pass ? "SMTP_PASS" : null,
    ].filter(Boolean);
    throw new Error(
      `Missing SMTP configuration: ${missing.join(", ")}. ` +
        "Please set them in BE/server/.env. For Gmail, use an App Password (not your normal password).",
    );
  }

  const port = Number(portRaw);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendEmail({ to, subject, html, text }) {
  const from =
    getEnv("SMTP_FROM") || getEnv("SMTP_USER") || "no-reply@techgear.local";

  const transporter = createTransport();
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendEmail };
