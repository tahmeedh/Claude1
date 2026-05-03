import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { generateSlots, getAvailableTables } from '../../../lib/reservations';
import { sendReservationConfirmation } from '../../../lib/email';

export const prerender = false;

const Body = z.object({
  guest_name: z.string().min(1),
  guest_email: z.string().email(),
  guest_phone: z.string().min(7),
  party_size: z.number().int().min(1).max(20),
  reservation_time: z.string().datetime(),
  special_requests: z.string().max(500).optional(),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request, locals }) => {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (e) {
    return json({ error: 'Invalid request body' }, 400);
  }

  const time = new Date(body.reservation_time);

  const available = await getAvailableTables(supabaseAdmin, time, body.party_size);
  if (available <= 0)
    return json({ error: 'No tables available for that time slot. Please choose a different time.' }, 409);

  const { data, error } = await supabaseAdmin.from('reservations').insert({
    ...body,
    user_id: locals.user?.id ?? null,
    status: 'confirmed',
  }).select().single();

  if (error) return json({ error: error.message }, 500);

  try {
    await sendReservationConfirmation(data);
  } catch {
    // Email failure doesn't block the reservation confirmation
  }

  return json(data, 201);
};

export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get('date');
  if (!date) return json({ error: 'date parameter required' }, 400);

  const tz = import.meta.env.RESTAURANT_TIMEZONE || 'America/New_York';
  const dateObj = new Date(date);
  const slotTimes = generateSlots(dateObj, tz);

  const slots = await Promise.all(
    slotTimes.map(async (time) => {
      const available = await getAvailableTables(supabaseAdmin, time, 1);
      return { time: time.toISOString(), available };
    })
  );

  return json(slots);
};
