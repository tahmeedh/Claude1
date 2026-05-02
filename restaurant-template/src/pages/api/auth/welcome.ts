import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { sendWelcomeEmail } from '../../../lib/email';

export const prerender = false;

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'WELCOME-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const POST: APIRoute = async ({ request }) => {
  let body: { userId: string; email: string; firstName: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  const { userId, email, firstName } = body;
  if (!userId || !email || !firstName) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  // Safety check: user must have been created within the last 10 minutes
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, created_at')
    .eq('id', userId)
    .single();

  if (!profile || profileError) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  const createdAt = new Date(profile.created_at);
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  if (createdAt < tenMinutesAgo) {
    return new Response(JSON.stringify({ error: 'Welcome code already issued' }), { status: 409 });
  }

  // Check if promo_codes table exists and if a code was already created for this user
  const { data: existing, error: tableError } = await supabaseAdmin
    .from('promo_codes')
    .select('code')
    .eq('user_id', userId)
    .maybeSingle();

  // If the table doesn't exist yet (migration pending), send email without code
  if (tableError && tableError.code === '42P01') {
    console.warn('promo_codes table does not exist — run migration 0002_promo_codes.sql in Supabase dashboard');
    try {
      await sendWelcomeEmail({ email, firstName, promoCode: 'SEE-EMAIL', discountPercent: 10 });
    } catch (err) {
      console.error('Welcome email failed:', err);
    }
    return new Response(JSON.stringify({ error: 'migration_pending' }), { status: 503 });
  }

  if (existing) {
    return new Response(JSON.stringify({ code: existing.code }), { status: 200 });
  }

  // Generate a unique code
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const { error: insertError } = await supabaseAdmin.from('promo_codes').insert({
      code,
      user_id: userId,
      discount_percent: 10,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (!insertError) break;
    code = generateCode();
    attempts++;
  }

  // Send the welcome email (don't block the response on email errors)
  try {
    await sendWelcomeEmail({ email, firstName, promoCode: code, discountPercent: 10 });
  } catch (err) {
    console.error('Welcome email failed:', err);
  }

  return new Response(JSON.stringify({ code }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
