import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendOrderConfirmation(order: any) {
  const email = order.guest_email ?? order.user_email;
  if (!email) return;
  await resend.emails.send({
    from: 'Restaurant <orders@yourdomain.com>',
    to: email,
    subject: `Order confirmed #${(order.id as string).slice(0, 8)}`,
    html: `<h1>Thanks for your order!</h1><p>Total: $${(order.total_cents / 100).toFixed(2)}</p>`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendReservationConfirmation(r: any) {
  await resend.emails.send({
    from: 'Restaurant <reservations@yourdomain.com>',
    to: r.guest_email,
    subject: 'Reservation confirmed',
    html: `<p>Hi ${r.guest_name}, see you on ${new Date(r.reservation_time).toLocaleString()} for ${r.party_size}.</p>`,
  });
}
