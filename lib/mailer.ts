import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendResetCode(to: string, username: string, code: string) {
  await transporter.sendMail({
    from: `"AWR Key System ⚡" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔑 Kode Reset Password - AWR Key System',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#030a14;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#0d1e35;border:1px solid #1a3a5c;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#003399,#0066cc);padding:28px 32px;text-align:center;">
      <div style="font-size:2.2rem;font-weight:900;color:#00aaff;letter-spacing:4px;text-shadow:0 0 20px rgba(0,170,255,0.5);">⚡ AWR</div>
      <div style="color:#80bfff;font-size:0.85rem;margin-top:4px;letter-spacing:2px;">KEY SYSTEM</div>
    </div>
    <div style="padding:32px;">
      <p style="color:#c8dff0;font-size:1rem;margin-bottom:8px;">Halo <strong style="color:#00d4ff;">${username}</strong>,</p>
      <p style="color:#6b9db8;font-size:0.9rem;margin-bottom:24px;">Kamu meminta reset password. Masukkan kode ini:</p>
      <div style="background:#030a14;border:2px solid #0066cc;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:2.5rem;font-weight:900;letter-spacing:8px;color:#00d4ff;font-family:monospace;">${code}</div>
      </div>
      <div style="background:rgba(255,179,0,0.08);border:1px solid rgba(255,179,0,0.2);border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <p style="color:#fbbf24;font-size:0.82rem;margin:0;">⏰ Kode berlaku <strong>20 menit</strong>. Jangan berikan kode ini ke siapapun.</p>
      </div>
      <p style="color:#3a6a8a;font-size:0.78rem;">Kalau kamu tidak meminta reset password, abaikan email ini.</p>
    </div>
    <div style="border-top:1px solid #1a3a5c;padding:16px 32px;text-align:center;">
      <p style="color:#3a6a8a;font-size:0.75rem;margin:0;">© Sanzxmzz · AWR Key System</p>
    </div>
  </div>
</body>
</html>`,
  })
}

export async function sendBroadcastEmail(to: string, username: string, title: string, content: string, from: string) {
  await transporter.sendMail({
    from: `"AWR Key System ⚡" <${process.env.EMAIL_USER}>`,
    to,
    subject: `📢 ${title} — AWR Key System`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#030a14;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#0d1e35;border:1px solid #1a3a5c;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#003399,#0066cc);padding:28px 32px;text-align:center;">
      <div style="font-size:2rem;font-weight:900;color:#00aaff;letter-spacing:4px;">⚡ AWR</div>
      <div style="color:#80bfff;font-size:0.85rem;margin-top:4px;">Pengumuman dari ${from}</div>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#00d4ff;margin-bottom:16px;">${title}</h2>
      <p style="color:#c8dff0;line-height:1.7;white-space:pre-wrap;">${content}</p>
    </div>
    <div style="border-top:1px solid #1a3a5c;padding:16px 32px;text-align:center;">
      <p style="color:#3a6a8a;font-size:0.75rem;margin:0;">© Sanzxmzz · AWR Key System</p>
    </div>
  </div>
</body>
</html>`,
  })
}
