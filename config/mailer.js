const nodemailer = require('nodemailer');

// Configure transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'mikekariuki10028@gmail.com',
    pass: 'qvfk dcie sjop hcxb',
  },
});

/**
 * Send an email using Gmail
 * @param {Object} param0
 * @param {string} param0.to - Recipient email
 * @param {string} param0.subject - Email subject
 * @param {string} param0.html - HTML body
 * @param {string} [param0.text] - Plain text body
 */
async function sendMail({ to, subject, html, text }) {
  const info = await transporter.sendMail({
    from: 'Security Awareness <no-reply@securityawareness.com>',
    to,
    subject,
    html,
    text,
  });
  console.log('Message sent: %s', info.messageId);
}

module.exports = { sendMail }; 