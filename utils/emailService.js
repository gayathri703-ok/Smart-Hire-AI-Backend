const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000
});

transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Email Error:", error);
  } else {
    console.log("✅ Email Server Ready");
  }
});

async function sendStatusEmail(toEmail, candidateName, jobTitle, company, status, recruiterNote = '') {
  const statusConfig = {
    accepted: {
      subject: `🎉 Great news! You've been accepted for ${jobTitle}`,
      color: '#00a882',
      heading: 'Congratulations!',
      message: `We're excited to let you know that <strong>${company}</strong> has accepted your application for the <strong>${jobTitle}</strong> position.`,
      emoji: '🎉'
    },
    rejected: {
      subject: `Update on your application for ${jobTitle}`,
      color: '#dc2626',
      heading: 'Application Update',
      message: `Thank you for applying to <strong>${jobTitle}</strong> at <strong>${company}</strong>. After careful review, the team has decided not to move forward with your application at this time.`,
      emoji: '📋'
    },
    in_review: {
      subject: `Your application for ${jobTitle} is being reviewed`,
      color: '#d97706',
      heading: 'Application In Review',
      message: `Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> is currently being reviewed by the hiring team.`,
      emoji: '👁️'
    }
  };

  const config = statusConfig[status];
  if (!config) return;

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: Arial, sans-serif; background: #f4f4f8; margin: 0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
      
      <div style="background: #0F0F1A; padding: 24px 32px;">
        <div style="color: #00FFB2; font-size: 22px; font-weight: 800; font-family: Arial, sans-serif;">
          Smart<span style="color: white;">Hire</span> AI
        </div>
      </div>

      <div style="padding: 32px;">
        <div style="font-size: 40px; margin-bottom: 16px;">${config.emoji}</div>
        <h1 style="color: ${config.color}; font-size: 24px; margin: 0 0 16px;">${config.heading}</h1>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
          Hi ${candidateName},
        </p>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          ${config.message}
        </p>

        ${recruiterNote ? `
        <div style="background: #f8f8fc; border-left: 4px solid ${config.color}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 600;">
            Note from the recruiter
          </div>
          <div style="font-size: 14px; color: #333; line-height: 1.5;">
            ${recruiterNote}
          </div>
        </div>
        ` : ''}

        <div style="background: #f8f8fc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 14px; color: #555;">
            <tr><td style="padding: 4px 0;"><strong>Position:</strong></td><td style="padding: 4px 0;">${jobTitle}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Company:</strong></td><td style="padding: 4px 0;">${company}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Status:</strong></td><td style="padding: 4px 0; color: ${config.color}; font-weight: 600; text-transform: capitalize;">${status.replace('_',' ')}</td></tr>
          </table>
        </div>

        ${status === 'accepted' ? `
        <p style="color: #333; font-size: 14px; line-height: 1.6;">
          The recruiter will be in touch soon with next steps. Congratulations again!
        </p>
        ` : status === 'rejected' ? `
        <p style="color: #333; font-size: 14px; line-height: 1.6;">
          We encourage you to keep applying — check the job board for more opportunities that match your skills.
        </p>
        ` : ''}

        <div style="text-align: center; margin-top: 32px;">
          <a href="https://smart-hire-ai-frontend-mu.vercel.app/applications" style="display: inline-block; background: ${config.color}; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            View My Applications
          </a>
        </div>
      </div>

      <div style="background: #f8f8fc; padding: 20px 32px; text-align: center; border-top: 1px solid #eee;">
        <div style="font-size: 12px; color: #999;">
          SmartHire AI — Resume Analyzer & Job Match Platform
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    await transporter.sendMail({
      from: `"SmartHire AI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: config.subject,
      html
    });
    console.log(`✅ Email sent to ${toEmail} — status: ${status}`);
    return true;
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return false;
  }
}

module.exports = { sendStatusEmail, transporter };