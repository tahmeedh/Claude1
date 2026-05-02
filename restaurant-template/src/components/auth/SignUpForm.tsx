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
  );
}
