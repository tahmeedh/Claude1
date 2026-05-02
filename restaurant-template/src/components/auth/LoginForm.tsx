import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { supabaseBrowser } from '../../lib/supabase/browser';

type Props = {
  next?: string;
  onSwitchToSignUp?: () => void;
};

export default function LoginForm({ next = '/', onSwitchToSignUp }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = next;
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/account/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setForgotSent(true);
  }

  if (showForgot) {
    if (forgotSent) {
      return (
        <div className="text-center space-y-3 py-4">
          <div className="text-4xl">📬</div>
          <p className="text-lg font-semibold">Check your email</p>
          <p className="text-muted-foreground text-sm">
            We sent a password reset link to <strong>{email}</strong>.
          </p>
          <button
            onClick={() => { setShowForgot(false); setForgotSent(false); }}
            className="text-primary text-sm font-medium hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      );
    }
    return (
      <form onSubmit={handleForgot} className="space-y-4">
        <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
        <div>
          <Label htmlFor="forgot-email">Email address</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Sending…' : 'Send Reset Link'}
        </Button>
        <button
          type="button"
          onClick={() => setShowForgot(false)}
          className="text-muted-foreground text-sm hover:underline w-full text-center block"
        >
          ← Back to Sign In
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="login-email">Email address</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="jane@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="login-password">Password</Label>
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="login-password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>

      {onSwitchToSignUp && (
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </button>
        </p>
      )}
    </form>
  );
}
