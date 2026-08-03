import { useState } from 'react';
import { MapPin, Mail, Lock, User as UserIcon, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

type Mode = 'signin' | 'signup';

export default function AuthScreen({ onBack }: { onBack: () => void }) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && !displayName.trim()) {
      setError('Please enter your name.');
      return;
    }
    setBusy(true);
    const result =
      mode === 'signin'
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password, displayName.trim());
    setBusy(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-safe bg-stone-50 text-stone-900">
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative mx-auto max-w-md px-6 py-12 text-center">
          <button
            onClick={onBack}
            className="absolute left-4 top-4 flex items-center gap-1 text-sm font-medium text-stone-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
            <MapPin className="h-4 w-4" />
            Scavenger Hunt
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-stone-300">
            {mode === 'signin'
              ? 'Sign in to organise teams and run multi-round competitions.'
              : 'Sign up to organise teams in advance and track competition results.'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-6 py-8">
        {/* Social sign-in */}
        <div className="space-y-3">
          <button
            onClick={signInWithApple}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-black px-4 py-3.5 font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M17.05 20.283c-.982.743-2.018 1.226-3.06 1.226-1.04 0-2.077-.483-3.058-1.226-1.02-.77-1.58-1.16-2.29-1.16-.71 0-1.27.39-2.29 1.16-1.02.77-2.05 1.226-3.06 1.226-.44 0-.87-.06-1.28-.18C2.41 19.93 1 17.57 1 14.5c0-3.03 1.41-5.39 4.02-6.4.41-.12.84-.18 1.28-.18 1.01 0 2.04.456 3.06 1.226 1.02.77 1.58 1.16 2.29 1.16.71 0 1.27-.39 2.29-1.16C15.9 8.686 16.94 8.203 17.98 8.203c.44 0 .87.06 1.28.18 2.61 1.01 4.02 3.37 4.02 6.4 0 3.07-1.41 5.43-4.02 6.4-.41.12-.84.18-1.28.18-.44 0-.87-.06-1.28-.18M14.5 7.5c-.83.83-2.42 1.46-3.5 1.46-1.08 0-2.67-.63-3.5-1.46C6.67 6.67 6.04 5.08 6.04 4c0-1.08.63-2.67 1.46-3.5C8.33-.33 9.92-.96 11-.96c1.08 0 2.67.63 3.5 1.46.83.83 1.46 2.42 1.46 3.5 0 1.08-.63 2.67-1.46 3.5" />
            </svg>
            Continue with Apple
          </button>
          <button
            onClick={signInWithGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-stone-200 bg-white px-4 py-3.5 font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-stone-400">or</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        {/* Email/password form */}
        <div className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Display name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border-2 border-stone-200 bg-white py-3 pl-10 pr-4 text-stone-900 outline-none transition focus:border-stone-900"
                />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-stone-200 bg-white py-3 pl-10 pr-4 text-stone-900 outline-none transition focus:border-stone-900"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border-2 border-stone-200 bg-white py-3 pl-10 pr-4 text-stone-900 outline-none transition focus:border-stone-900"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3.5 font-semibold text-white shadow-lg transition hover:bg-stone-800 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
            className="font-semibold text-stone-900 underline underline-offset-2"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
