import { useState } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

type Props = {
  defaultTab?: 'signin' | 'signup';
  next?: string;
};

export default function AuthTabs({ defaultTab = 'signin', next = '/account/orders' }: Props) {
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);

  return (
    <div>
      {/* Tabs */}
      <div className="flex rounded-xl border bg-muted/40 p-1 mb-6">
        <button
          onClick={() => setTab('signin')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
            tab === 'signin'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setTab('signup')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
            tab === 'signup'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Create Account
        </button>
      </div>

      {tab === 'signin' ? (
        <LoginForm
          next={next}
          onSwitchToSignUp={() => setTab('signup')}
        />
      ) : (
        <SignUpForm
          next={next}
          onSwitchToLogin={() => setTab('signin')}
        />
      )}
    </div>
  );
}
