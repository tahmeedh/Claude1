import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export const prerender = false;

const PatchBody = z.object({
  status: z.enum(['pending','confirmed','seated','completed','cancelled','no_show']).optional(),
  table_number: z.number().int().positive().optional(),
});

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  const { id } = params;
  if (!id) return new Response('id required', { status: 400 });

  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await request.json());
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });
  const { id } = params;
  if (!id) return new Response('id required', { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
