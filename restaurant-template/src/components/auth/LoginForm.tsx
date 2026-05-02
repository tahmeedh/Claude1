import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { supabaseBrowser } from '../../lib/supabase/browser';

type Props = {
  mode: 'magic' | 'password';
  next?: string;
  onSwitchToSignUp?: () => void;
};

export default function LoginForm({ mode, next = '/', onSwitchToSignUp }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'magic') {
      const { error } = await supabaseBrowser.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}${next}` },
      });
      if (error) setError(error.message);
      else setSent(true);
    } else {
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = next;
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="text-4xl">📬</div>
        <p className="text-lg font-semibold">Check your email</p>
        <p className="text-muted-foreground text-sm">
          We sent a magic link to <strong>{email}</strong>.<br />
          Click it to sign in — no password needed.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(''); }}
          className="text-primary text-sm font-medium hover:underline mt-2 block mx-auto"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="jane@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>
      {mode === 'password' && (
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
      )}
      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? 'Please wait…' : mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
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
