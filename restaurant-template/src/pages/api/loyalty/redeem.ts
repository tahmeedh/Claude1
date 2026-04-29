import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export const prerender = false;

const Body = z.object({
  rewardId: z.string().uuid(),
});

// Validates redemption eligibility. Actual point deduction happens in the Stripe
// webhook after successful payment — never here.
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { data: reward } = await supabaseAdmin
    .from('loyalty_rewards')
    .select('*')
    .eq('id', body.rewardId)
    .eq('is_active', true)
    .single();

  if (!reward)
    return new Response(JSON.stringify({ error: 'Reward not found' }), { status: 404 });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('loyalty_points')
    .eq('id', locals.user.id)
    .single();

  if (!profile || profile.loyalty_points < reward.points_cost)
    return new Response(JSON.stringify({ error: 'Insufficient points' }), { status: 400 });

  return new Response(JSON.stringify({
    valid: true,
    reward,
    currentPoints: profile.loyalty_points,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
