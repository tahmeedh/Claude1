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
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleGoogleSignIn() {
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
    <div className="space-y-4">
      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center gap-3"
        size="lg"
        onClick={handleGoogleSignIn}
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
          <span className="bg-card px-2 text-muted-foreground">or sign in with email</span>
        </div>
      </div>

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
    </div>
  );
}
