import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const FROM_ORDERS       = 'Restaurant <orders@yourdomain.com>';
const FROM_RESERVATIONS = 'Restaurant <reservations@yourdomain.com>';
const FROM_WELCOME      = 'Restaurant <hello@yourdomain.com>';

// ─── Order confirmation ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendOrderConfirmation(order: any) {
  const email = order.guest_email ?? order.user_email;
  if (!email) return;
  await resend.emails.send({
    from: FROM_ORDERS,
    to: email,
    subject: `Order confirmed #${(order.id as string).slice(0, 8).toUpperCase()}`,
    html: `<h1>Thanks for your order!</h1><p>Total: $${(order.total_cents / 100).toFixed(2)}</p>`,
  });
}

// ─── Reservation confirmation ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendReservationConfirmation(r: any) {
  await resend.emails.send({
    from: FROM_RESERVATIONS,
    to: r.guest_email,
    subject: 'Reservation confirmed',
    html: `<p>Hi ${r.guest_name}, see you on ${new Date(r.reservation_time).toLocaleString()} for ${r.party_size}.</p>`,
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

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to the Restaurant</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#1a1a2e;border-radius:16px 16px 0 0;padding:40px 40px 32px;">
              <div style="font-size:48px;margin-bottom:12px;">🍽</div>
              <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px;font-weight:700;letter-spacing:-0.5px;">
                Welcome, ${firstName}!
              </h1>
              <p style="color:#a0a0c0;font-size:15px;margin:0;">
                Your account is confirmed. We're thrilled to have you.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">

              <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Hi <strong>${firstName}</strong>,<br><br>
                Thank you for creating an account with us. As a welcome gift, here's a
                <strong>${discountPercent}% discount</strong> off your first order — on us!
              </p>

              <!-- Promo code box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 28px 24px;
                  ">
                    <p style="color:#e8d5ff;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;font-weight:600;">
                      Your Welcome Discount Code
                    </p>
                    <div style="
                      background:rgba(255,255,255,0.15);
                      border:2px dashed rgba(255,255,255,0.4);
                      border-radius:8px;
                      padding:14px 28px;
                      display:inline-block;
                    ">
                      <span style="
                        color:#ffffff;
                        font-size:32px;
                        font-weight:700;
                        letter-spacing:4px;
                        font-family:'Courier New',monospace;
                      ">${promoCode}</span>
                    </div>
                    <p style="color:#d4b8ff;font-size:13px;margin:12px 0 0;">
                      ${discountPercent}% off your entire order · Valid until ${expiry} · One use only
                    </p>
                  </td>
                </tr>
              </table>

              <!-- How to use -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6ff;border-radius:10px;padding:20px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#4a4a6a;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">
                      How to use your code
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#667eea;font-weight:700;margin-right:8px;">1.</span>
                          <span style="color:#555;font-size:14px;">Browse our menu and add items to your cart</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#667eea;font-weight:700;margin-right:8px;">2.</span>
                          <span style="color:#555;font-size:14px;">Enter <strong style="color:#1a1a2e;font-family:monospace;">${promoCode}</strong> at checkout</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#667eea;font-weight:700;margin-right:8px;">3.</span>
                          <span style="color:#555;font-size:14px;">Enjoy ${discountPercent}% off your order automatically</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Perks -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td align="center" style="padding:0 8px 0 0;" width="33%">
                    <div style="background:#fff7ed;border-radius:10px;padding:20px 12px;text-align:center;">
                      <div style="font-size:28px;margin-bottom:8px;">⭐</div>
                      <p style="color:#1a1a2e;font-size:13px;font-weight:700;margin:0 0 4px;">Earn Points</p>
                      <p style="color:#888;font-size:12px;margin:0;">1 point per $1 spent</p>
                    </div>
                  </td>
                  <td align="center" style="padding:0 4px;" width="33%">
                    <div style="background:#f0fdf4;border-radius:10px;padding:20px 12px;text-align:center;">
                      <div style="font-size:28px;margin-bottom:8px;">📦</div>
                      <p style="color:#1a1a2e;font-size:13px;font-weight:700;margin:0 0 4px;">Track Orders</p>
                      <p style="color:#888;font-size:12px;margin:0;">Real-time updates</p>
                    </div>
                  </td>
                  <td align="center" style="padding:0 0 0 8px;" width="33%">
                    <div style="background:#fdf4ff;border-radius:10px;padding:20px 12px;text-align:center;">
                      <div style="font-size:28px;margin-bottom:8px;">🎂</div>
                      <p style="color:#1a1a2e;font-size:13px;font-weight:700;margin:0 0 4px;">Birthday Treat</p>
                      <p style="color:#888;font-size:12px;margin:0;">Special surprise on your day</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${import.meta.env.PUBLIC_SITE_URL ?? 'https://restaurantreplit.netlify.app'}/menu"
                       style="
                         display:inline-block;
                         background:#1a1a2e;
                         color:#ffffff;
                         text-decoration:none;
                         font-size:16px;
                         font-weight:700;
                         padding:16px 40px;
                         border-radius:50px;
                         letter-spacing:0.5px;
                       ">
                      Browse the Menu →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#f0ede8;border-radius:0 0 16px 16px;padding:24px 40px;">
              <p style="color:#999;font-size:12px;margin:0 0 6px;">
                This discount is valid for one use only and expires ${expiry}.
              </p>
              <p style="color:#bbb;font-size:11px;margin:0;">
                © ${new Date().getFullYear()} Restaurant. All rights reserved.
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
    from: FROM_WELCOME,
    to: email,
    subject: `Welcome ${firstName}! Here's your ${discountPercent}% welcome discount 🎉`,
    html,
  });
}
