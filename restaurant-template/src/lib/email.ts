import { Resend } from 'resend';

function getResendKey(): string {
  return (
    (typeof process !== 'undefined' && process.env?.RESEND_API_KEY) ||
    (import.meta.env?.RESEND_API_KEY as string | undefined) ||
    ''
  );
}

function getResend() {
  return new Resend(getResendKey());
}

function fromAddr(local: string): string {
  const domain =
    (typeof process !== 'undefined' && process.env?.RESEND_FROM_DOMAIN) ||
    (import.meta.env?.RESEND_FROM_DOMAIN as string | undefined);
  if (domain) return `Restaurant City <${local}@${domain}>`;
  return 'Restaurant City <onboarding@resend.dev>';
}

// ─── Order confirmation ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendOrderConfirmation(order: any) {
  const email = order.guest_email ?? order.user_email;
  if (!email) return;
  const resend = getResend();
  await resend.emails.send({
    from: fromAddr('orders'),
    to: email,
    subject: `Order confirmed #${(order.id as string).slice(0, 8).toUpperCase()} — Restaurant City`,
    html: `<h1>Thanks for your order!</h1><p>Total: $${(order.total_cents / 100).toFixed(2)}</p>`,
  });
}

// ─── Reservation confirmation ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendReservationConfirmation(r: any) {
  const resend = getResend();
  await resend.emails.send({
    from: fromAddr('reservations'),
    to: r.guest_email,
    subject: `Reservation Confirmed — Restaurant City`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0f8ff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f8ff;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td align="center" style="background:#5ab4f0;border-radius:16px 16px 0 0;padding:32px 40px 24px;">
            <p style="font-size:13px;color:#fff;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Restaurant City</p>
            <h1 style="color:#fff;font-size:26px;margin:0 0 8px;font-weight:700;">Reservation Confirmed!</h1>
            <p style="color:#d0f0ff;font-size:14px;margin:0;">We can't wait to see you, ${r.guest_name}.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f8ff;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:600;">Your Booking Details</p>
                  <p style="margin:4px 0;font-size:15px;color:#333;"><strong>Date &amp; Time:</strong> ${new Date(r.reservation_time).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p style="margin:4px 0;font-size:15px;color:#333;"><strong>Party Size:</strong> ${r.party_size} guest${r.party_size > 1 ? 's' : ''}</p>
                  ${r.special_requests ? `<p style="margin:4px 0;font-size:15px;color:#333;"><strong>Special Requests:</strong> ${r.special_requests}</p>` : ''}
                </td>
              </tr>
            </table>
            <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 20px;">If you need to make any changes, please contact us as soon as possible. We look forward to welcoming you!</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="background:#f0ede8;border-radius:0 0 16px 16px;padding:20px 40px;">
            <p style="color:#bbb;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} Restaurant City. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

// ─── Welcome email with promo code ────────────────────────────────────────────
export async function sendWelcomeEmail({
  email,
  firstName,
  promoCode,
  discountPercent = 10,
}: {
  email: string;
  firstName: string;
  promoCode: string;
  discountPercent?: number;
}) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  const expiry = expiryDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const siteUrl =
    (typeof process !== 'undefined' && process.env?.PUBLIC_SITE_URL) ||
    (import.meta.env?.PUBLIC_SITE_URL as string | undefined) ||
    'https://restaurantreplit.netlify.app';

  const resend = getResend();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Restaurant City</title>
</head>
<body style="margin:0;padding:0;background:#f0f8ff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f8ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="background:linear-gradient(180deg,#5ab4f0 0%,#42aadc 100%);border-radius:16px 16px 0 0;padding:40px 40px 32px;">
              <p style="color:#fff;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">Restaurant City</p>
              <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px;font-weight:700;letter-spacing:-0.5px;">
                Welcome, ${firstName}!
              </h1>
              <p style="color:#d0f0ff;font-size:15px;margin:0;">
                Your account is ready. We're thrilled to have you.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:40px;">
              <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Hi <strong>${firstName}</strong>,<br><br>
                Thank you for joining Restaurant City. As a welcome gift, here's a
                <strong>${discountPercent}% discount</strong> off your first order &mdash; on us!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#ff8aaa 0%,#e8507a 100%);border-radius:12px;padding:28px 24px;">
                    <p style="color:#ffe0e8;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;font-weight:600;">
                      Your Welcome Discount Code
                    </p>
                    <div style="background:rgba(255,255,255,0.15);border:2px dashed rgba(255,255,255,0.5);border-radius:8px;padding:14px 28px;display:inline-block;">
                      <span style="color:#ffffff;font-size:32px;font-weight:700;letter-spacing:4px;font-family:'Courier New',monospace;">${promoCode}</span>
                    </div>
                    <p style="color:#ffd0da;font-size:13px;margin:12px 0 0;">
                      ${discountPercent}% off your entire order &middot; Valid until ${expiry} &middot; One use only
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td align="center" style="padding:0 8px 0 0;" width="33%">
                    <div style="background:#fff7ed;border-radius:10px;padding:20px 12px;text-align:center;">
                      <div style="font-size:28px;margin-bottom:8px;">&#11088;</div>
                      <p style="color:#1a1a2e;font-size:13px;font-weight:700;margin:0 0 4px;">Earn Points</p>
                      <p style="color:#888;font-size:12px;margin:0;">1 point per $1 spent</p>
                    </div>
                  </td>
                  <td align="center" style="padding:0 4px;" width="33%">
                    <div style="background:#f0fdf4;border-radius:10px;padding:20px 12px;text-align:center;">
                      <div style="font-size:28px;margin-bottom:8px;">&#128230;</div>
                      <p style="color:#1a1a2e;font-size:13px;font-weight:700;margin:0 0 4px;">Track Orders</p>
                      <p style="color:#888;font-size:12px;margin:0;">Real-time updates</p>
                    </div>
                  </td>
                  <td align="center" style="padding:0 0 0 8px;" width="33%">
                    <div style="background:#fdf4ff;border-radius:10px;padding:20px 12px;text-align:center;">
                      <div style="font-size:28px;margin-bottom:8px;">&#127874;</div>
                      <p style="color:#1a1a2e;font-size:13px;font-weight:700;margin:0 0 4px;">Birthday Treat</p>
                      <p style="color:#888;font-size:12px;margin:0;">Surprise on your day</p>
                    </div>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/menu"
                       style="display:inline-block;background:linear-gradient(180deg,#ff8aaa 0%,#e8507a 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;letter-spacing:0.5px;box-shadow:0 4px 0 #b03060;">
                      Browse the Menu &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#f0ede8;border-radius:0 0 16px 16px;padding:24px 40px;">
              <p style="color:#999;font-size:12px;margin:0 0 6px;">
                This discount is valid for one use only and expires ${expiry}.
              </p>
              <p style="color:#bbb;font-size:11px;margin:0;">
                &copy; ${new Date().getFullYear()} Restaurant City. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: fromAddr('hello'),
    to: email,
    subject: `Welcome to Restaurant City, ${firstName}! Here's your ${discountPercent}% welcome discount`,
    html,
  });
}
