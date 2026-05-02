import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase/server';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const supabase = createSupabaseServerClient(ctx.cookies);

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error('[middleware] Supabase auth.getUser() failed:', err);
  }

  ctx.locals.user = user;
  ctx.locals.supabase = supabase;

  const path = ctx.url.pathname;

  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    if (!user) return ctx.redirect('/account/login?next=' + encodeURIComponent(path));
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 });
    ctx.locals.profile = profile;
  }

  return next();
});
