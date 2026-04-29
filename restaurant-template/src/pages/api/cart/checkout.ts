import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { z } from 'zod';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

const Body = z.object({
  items: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().positive() })).min(1),
  fulfillment: z.enum(['pickup','delivery']),
  guest: z.object({
    name: z.string().min(1), email: z.string().email(), phone: z.string().min(7),
  }).optional(),
  redeemRewardId: z.string().uuid().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  // Re-fetch authoritative prices (never trust client)
  const { data: items } = await supabaseAdmin
    .from('menu_items')
    .select('id,name,price_cents,is_available')
    .in('id', body.items.map(i => i.id));

  if (!items || items.length !== body.items.length)
    return new Response('Invalid items', { status: 400 });

  const lineMap = new Map(body.items.map(i => [i.id, i.quantity]));
  let subtotal = 0;
  const stripeLines: Stripe.Checkout.SessionCreateParams['line_items'] = [];
  for (const it of items) {
    if (!it.is_available) return new Response(`${it.name} unavailable`, { status: 400 });
    const qty = lineMap.get(it.id)!;
    subtotal += it.price_cents * qty;
    stripeLines.push({
      price_data: {
        currency: 'usd',
        product_data: { name: it.name },
        unit_amount: it.price_cents,
      },
      quantity: qty,
    });
  }

  const tax = Math.round(subtotal * 0.0875);

  // Loyalty redemption
  let discountCents = 0;
  let pointsRedeemed = 0;
  if (body.redeemRewardId && locals.user) {
    const { data: reward } = await supabaseAdmin
      .from('loyalty_rewards').select('*').eq('id', body.redeemRewardId).single();
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('loyalty_points').eq('id', locals.user.id).single();
    if (reward && profile && profile.loyalty_points >= reward.points_cost) {
      pointsRedeemed = reward.points_cost;
      if (reward.reward_type === 'discount_cents') discountCents = reward.reward_value;
      if (reward.reward_type === 'percent_off')
        discountCents = Math.round(subtotal * (reward.reward_value / 100));
    }
  }

  const total = Math.max(50, subtotal + tax - discountCents); // Stripe minimum

  // Create draft order
  const { data: order, error } = await supabaseAdmin.from('orders').insert({
    user_id: locals.user?.id ?? null,
    guest_email: body.guest?.email ?? null,
    guest_name: body.guest?.name ?? null,
    guest_phone: body.guest?.phone ?? null,
    status: 'pending',
    fulfillment: body.fulfillment,
    subtotal_cents: subtotal,
    tax_cents: tax,
    total_cents: total,
    points_redeemed: pointsRedeemed,
  }).select().single();
  if (error) return new Response(error.message, { status: 500 });

  await supabaseAdmin.from('order_items').insert(items.map(it => ({
    order_id: order.id,
    menu_item_id: it.id,
    name_snapshot: it.name,
    unit_price_cents: it.price_cents,
    quantity: lineMap.get(it.id)!,
  })));

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    line_items: stripeLines,
    customer_email: locals.user?.email ?? body.guest?.email,
    success_url: `${import.meta.env.PUBLIC_SITE_URL}/account/orders?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${import.meta.env.PUBLIC_SITE_URL}/menu`,
    metadata: { order_id: order.id, points_redeemed: String(pointsRedeemed) },
  };

  if (discountCents > 0) {
    const coupon = await stripe.coupons.create({ amount_off: discountCents, currency: 'usd', duration: 'once' });
    sessionParams.discounts = [{ coupon: coupon.id }];
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  await supabaseAdmin.from('orders')
    .update({ stripe_session_id: session.id }).eq('id', order.id);

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
