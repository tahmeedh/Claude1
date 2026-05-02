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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
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
        emailRedirectTo: `${location.origin}${next}`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Update profile with phone and full name
      await supabaseBrowser
        .from('profiles')
        .update({ phone: form.phone, full_name: fullName })
        .eq('id', data.user.id);

      // Trigger welcome email + promo code generation (fire and forget, handle errors silently)
      try {
        const res = await fetch('/api/auth/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            email: form.email,
            firstName: form.firstName.trim(),
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.code) setPromoCode(json.code);
        }
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
        <div className="text-5xl">🎉</div>
        <p className="text-xl font-bold">Welcome aboard!</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We sent a confirmation email to <strong>{form.email}</strong>.<br />
          Click the link inside to activate your account.
        </p>

        {promoCode && (
          <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Your Welcome Discount
            </p>
            <p className="font-mono text-2xl font-bold tracking-widest text-primary">
              {promoCode}
            </p>
            <p className="text-xs text-muted-foreground">
              10% off your first order · Valid for 30 days · One use only
            </p>
            <p className="text-xs text-muted-foreground">
              We also sent this code to your email so you won't lose it.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <a
            href="/menu"
            className="inline-block w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground text-center hover:opacity-90 transition-opacity"
          >
            Browse the Menu →
          </a>
          {onSwitchToLogin && (
            <button
              onClick={onSwitchToLogin}
              className="text-muted-foreground text-sm hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Jane"
            value={form.firstName}
            onChange={e => set('firstName', e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last name <span className="text-destructive">*</span></Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Smith"
            value={form.lastName}
            onChange={e => set('lastName', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="su-email">Email address <span className="text-destructive">*</span></Label>
        <Input
          id="su-email"
          type="email"
          placeholder="jane@example.com"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          required
        />
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="phone">Phone number <span className="text-destructive">*</span></Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+34 600 000 000"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">Used for reservation and order updates only.</p>
      </div>

      {/* Date of birth */}
      <div>
        <Label htmlFor="dob">
          Date of birth{' '}
          <span className="text-muted-foreground text-xs font-normal">(optional — for birthday rewards)</span>
        </Label>
        <Input
          id="dob"
          type="date"
          value={form.dob}
          onChange={e => set('dob', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="su-password">Password <span className="text-destructive">*</span></Label>
        <Input
          id="su-password"
          type="password"
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={e => set('password', e.target.value)}
          required
          minLength={8}
        />
      </div>

      {/* Confirm password */}
      <div>
        <Label htmlFor="su-confirm">Confirm password <span className="text-destructive">*</span></Label>
        <Input
          id="su-confirm"
          type="password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={e => set('confirmPassword', e.target.value)}
          required
        />
      </div>

      {/* Marketing opt-in */}
      <div className="flex items-start gap-2 pt-1">
        <input
          id="marketing"
          type="checkbox"
          checked={form.marketing}
          onChange={e => set('marketing', e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
        />
        <Label htmlFor="marketing" className="text-sm font-normal text-muted-foreground cursor-pointer leading-snug">
          Send me exclusive offers, loyalty bonus updates, and news about new menu items.
        </Label>
      </div>

      {/* Privacy notice */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        By creating an account you agree to our{' '}
        <a href="#" className="underline hover:text-foreground">Privacy Policy</a> and{' '}
        <a href="#" className="underline hover:text-foreground">Terms of Service</a>.
        Your data is used solely to manage your orders, reservations, and loyalty rewards.
      </p>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? 'Creating account…' : 'Create Account & Get 10% Off'}
      </Button>

      {onSwitchToLogin && (
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      )}
    </form>
  );
}
