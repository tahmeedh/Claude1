import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { supabaseBrowser } from '../../lib/supabase/browser';

type Props = {
  next?: string;
  onSwitchToLogin?: () => void;
};

export default function SignUpForm({ next = '/account/orders', onSwitchToLogin }: Props) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
    marketing: false,
  });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleGoogleSignUp() {
    setOauthLoading(true);
    setError('');
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    const phoneClean = form.phone.replace(/\s/g, '');
    if (phoneClean.length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const siteUrl = window.location.origin;

    const { data, error: signUpError } = await supabaseBrowser.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: fullName,
          phone: form.phone,
          date_of_birth: form.dob || null,
          marketing_opt_in: form.marketing,
        },
        emailRedirectTo: `${siteUrl}${next}`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Send welcome email with promo code in background
    if (data.user) {
      try {
        await fetch('/api/auth/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            email: form.email,
            firstName: form.firstName.trim(),
          }),
        });
      } catch {
        // Email failure doesn't break signup
      }
    }

    setLoading(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="text-5xl">📧</div>
        <p className="text-xl font-bold">Verify your email</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We sent a confirmation link to <strong>{form.email}</strong>.<br />
          Click it to activate your account and sign in.
        </p>
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <p>Check your spam folder if you don't see it within a minute.</p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <p className="text-primary font-semibold">🎁 Your welcome email also includes a 10% discount code for your first order!</p>
        </div>
        {onSwitchToLogin && (
          <button
            onClick={onSwitchToLogin}
            className="text-primary text-sm font-medium hover:underline mt-2"
          >
            Back to Sign In
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center gap-3"
        size="lg"
        onClick={handleGoogleSignUp}
        disabled={oauthLoading}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
          <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
          <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
          <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
        </svg>
        {oauthLoading ? 'Redirecting…' : 'Continue with Google'}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or create account with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
            <Input id="firstName" type="text" placeholder="Jane" value={form.firstName} onChange={e => set('firstName', e.target.value)} required autoFocus />
          </div>
          <div>
            <Label htmlFor="lastName">Last name <span className="text-destructive">*</span></Label>
            <Input id="lastName" type="text" placeholder="Smith" value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
          </div>
        </div>

        <div>
          <Label htmlFor="su-email">Email address <span className="text-destructive">*</span></Label>
          <Input id="su-email" type="email" placeholder="jane@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="phone">Phone number <span className="text-destructive">*</span></Label>
          <Input id="phone" type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={e => set('phone', e.target.value)} required />
          <p className="text-xs text-muted-foreground mt-1">Used for reservation and order updates only.</p>
        </div>

        <div>
          <Label htmlFor="dob">
            Date of birth{' '}
            <span className="text-muted-foreground text-xs font-normal">(optional — for birthday rewards)</span>
          </Label>
          <Input id="dob" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} max={new Date().toISOString().split('T')[0]} />
        </div>

        <div>
          <Label htmlFor="su-password">Password <span className="text-destructive">*</span></Label>
          <Input id="su-password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
        </div>

        <div>
          <Label htmlFor="su-confirm">Confirm password <span className="text-destructive">*</span></Label>
          <Input id="su-confirm" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input id="marketing" type="checkbox" checked={form.marketing} onChange={e => set('marketing', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer" />
          <Label htmlFor="marketing" className="text-sm font-normal text-muted-foreground cursor-pointer leading-snug">
            Send me exclusive offers, loyalty bonus updates, and news about new menu items.
          </Label>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          By creating an account you agree to our{' '}
          <a href="#" className="underline hover:text-foreground">Privacy Policy</a> and{' '}
          <a href="#" className="underline hover:text-foreground">Terms of Service</a>.
        </p>

        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Creating account…' : 'Create Account & Get 10% Off'}
        </Button>

        {onSwitchToLogin && (
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button type="button" onClick={onSwitchToLogin} className="text-primary font-medium hover:underline">
              Sign in
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
