const SITE = process.env.SITE_URL || 'http://127.0.0.1:3000'
const FROM = process.env.RESEND_FROM || 'FoundaScrow <onboarding@resend.dev>'

function wrap(subject: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#0a0f16;padding:24px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#101823;border:1px solid #24313f;border-radius:16px;padding:32px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:36px;height:36px;border-radius:50%;border:3px solid #f59e0b;color:#f59e0b;font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center;">S</div>
      <span style="color:#f8fafc;font-size:16px;font-weight:700;">FoundaScrow</span>
    </div>
    <div style="color:#f8fafc;font-size:20px;font-weight:700;margin-top:24px;">${subject}</div>
    <div style="color:#94a3b8;font-size:14px;line-height:1.7;margin-top:12px;">${body}</div>
    <div style="color:#475569;font-size:11px;margin-top:32px;">FoundaScrow · Buy and sell without fear · ${SITE}</div>
  </div></body></html>`
}

export async function sendEmail(to: string, subject: string, body: string) {
  const key = process.env.RESEND_API_KEY
  if (!key || !to) return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html: wrap(subject, body) }),
    })
  } catch {}
}

export const cta = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:20px;background:#f59e0b;color:#0a0f16;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;">${label}</a>`

export const emails = {
  receipt(to: string, title: string, ref: string, total: string) {
    return sendEmail(to, `Payment received — ${title}`,
      `Your payment of <strong style="color:#f59e0b;">₦${total}</strong> is safe in the vault.<br/>Reference: <strong style="color:#f8fafc;">${ref}</strong><br/>The seller only gets paid when you confirm delivery.${cta(`${SITE}/track/${ref}`, 'Track your payment')}`)
  },
  funded(to: string, title: string, ref: string) {
    return sendEmail(to, `You've been funded — ${title}`,
      `Great news: the buyer's payment for <strong style="color:#f8fafc;">${title}</strong> has landed in the vault.<br/>Reference: ${ref}<br/>Deliver the item now — payout releases when the buyer confirms.${cta(`${SITE}/track/${ref}`, 'View order')}`)
  },
  payout(to: string, title: string, ref: string, amount: string, transfer: string) {
    return sendEmail(to, `Payout sent — ₦${amount}`,
      `Your money for <strong style="color:#f8fafc;">${title}</strong> is on its way to your bank.<br/>Reference: ${ref}<br/>Transfer ID: ${transfer}<br/>Expect the alert shortly.${cta(`${SITE}/track/${ref}`, 'View order')}`)
  },
  abandoned(to: string, title: string, ref: string) {
    return sendEmail(to, `Your payment for "${title}" is still waiting`,
      `We noticed you didn't complete payment. No money left your account.<br/>Your order link is still active — the seller's item is reserved for you.${cta(`${SITE}/pay/${ref}`, 'Resume payment')}`)
  },
}
