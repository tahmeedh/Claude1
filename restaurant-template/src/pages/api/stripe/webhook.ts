import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { sendOrderConfirmation } from '../../../lib/email';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature')!;
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, import.meta.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`Webhook error: ${(e as Error).message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    const pointsRedeemed = Number(session.metadata?.points_redeemed ?? 0);
    if (!orderId) return new Response('ok');

    const { data: order } = await supabaseAdmin
      .from('orders').select('*').eq('id', orderId).single();
    if (!order) return new Response('ok');

    // 1 point per dollar of subtotal
    const pointsEarned = Math.floor(order.subtotal_cents / 100);

    await supabaseAdmin.from('orders').update({
      status: 'paid',
      stripe_payment_intent: session.payment_intent as string,
      points_earned: pointsEarned,
    }).eq('id', orderId);

    if (order.user_id) {
      if (pointsRedeemed > 0)
        await supabaseAdmin.rpc('apply_loyalty_points', {
          p_user_id: order.user_id, p_points: -pointsRedeemed,
          p_order_id: orderId, p_reason: 'reward_redemption',
        });
      if (pointsEarned > 0)
        await supabaseAdmin.rpc('apply_loyalty_points', {
          p_user_id: order.user_id, p_points: pointsEarned,
          p_order_id: orderId, p_reason: 'order_earn',
        });
    }

    await sendOrderConfirmation(order);
  }

  return new Response('ok');
};
