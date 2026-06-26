const nodemailer = require('nodemailer');

async function sendStatusEmail(toEmail, candidateName, jobTitle, company, status, recruiterNote = '') {
  console.log(`📨 sendStatusEmail called → to: ${toEmail}, status: ${status}`);

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
  if (!config) {
    console.log(`⚠️ No email config for status: ${status} — skipping`);
    return;
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: Arial, sans-serif; background: #f4f4f8; margin: 0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
      <div style="background: #0F0F1A; padding: 24px 32px;">
        <div style="color: #00FFB2; font-size: 22px; font-weight: 800;">
          Smart<span style="color: white;">Hire</span> AI
        </div>
      </div>
      <div style="padding: 32px;">
        <div style="font-size: 40px; margin-bottom: 16px;">${config.emoji}</div>
        <h1 style="color: ${config.color}; font-size: 24px; margin: 0 0 16px;">${config.heading}</h1>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">Hi ${candidateName},</p>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">${config.message}</p>
        ${recruiterNote ? `
        <div style="background: #f8f8fc; border-left: 4px solid ${config.color}; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 12px; color: #888; margin-bottom: 6px;">NOTE FROM RECRUITER</div>
          <div style="font-size: 14px; color: #333;">${recruiterNote}</div>
        </div>` : ''}
        <div style="background: #f8f8fc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 14px; color: #555;">
            <tr><td style="padding: 4px 0;"><strong>Position:</strong></td><td style="padding: 4px 0;">${jobTitle}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Company:</strong></td><td style="padding: 4px 0;">${company}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Status:</strong></td><td style="padding: 4px 0; color:${config.color}; font-weight:600;">${status.replace('_', ' ')}</td></tr>
          </table>
        </div>
        ${status === 'accepted' ? `
        <p style="color: #333; font-size: 14px; line-height: 1.6;">
          The recruiter will be in touch soon with next steps. Congratulations again!
        </p>` : status === 'rejected' ? `
        <p style="color: #333; font-size: 14px; line-height: 1.6;">
          We encourage you to keep applying — check the job board for more opportunities that match your skills.
        </p>` : ''}
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://smart-hire-ai-frontend-mu.vercel.app/applications"
             style="display: inline-block; background: ${config.color}; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
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
  </html>`;

  // ✅ Brevo HTTP API — works on Render free tier
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: 'SmartHire AI', email: 'aff387001@smtp-brevo.com' }, // ← Brevo sender
      to: [{ email: toEmail, name: candidateName }],
      subject: config.subject,
      htmlContent: html
    })
  });

  const result = await response.json();
  console.log(`✅ Email sent via Brevo API — messageId: ${result.messageId}`);
  return true;
}

// Startup check
console.log('✅ Email Service Ready (Brevo HTTP API)');

module.exports = { sendStatusEmail };