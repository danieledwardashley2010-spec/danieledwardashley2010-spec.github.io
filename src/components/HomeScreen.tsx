import { useState } from 'react';
import { MapPin, Compass, Users, ArrowRight } from 'lucide-react';

interface Props {
  onCreate: () => void;
  onJoin: (code: string) => void;
}

export default function HomeScreen({ onCreate, onJoin }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 5) {
      setError('Enter the 5-letter code from your invite link.');
      return;
    }
    setError('');
    onJoin(trimmed);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
            <MapPin className="h-4 w-4" />
            Liverpool City Centre
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            The Liverpool Scavenger Hunt
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-stone-300">
            Build a multiplayer adventure across the city. One person sets it up, teams join with a link, and GPS verifies every stop.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          <button
            onClick={onCreate}
            className="group rounded-3xl border-2 border-stone-200 bg-white p-8 text-left transition-all hover:border-stone-900 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white">
              <Compass className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Create a hunt</h2>
            <p className="mt-2 text-sm text-stone-600">
              Set up a scavenger hunt: choose a theme, difficulty, custom finish point, and occasion. Then invite teams to join.
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-stone-900">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          <div className="rounded-3xl border-2 border-stone-200 bg-white p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-stone-900">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Join a hunt</h2>
            <p className="mt-2 text-sm text-stone-600">
              Got an invite code from a friend? Enter it below to join their hunt as a team.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="e.g. HUNT5"
              maxLength={5}
              className="mt-4 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-lg font-bold tracking-widest text-stone-900 outline-none transition focus:border-stone-900"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button
              onClick={handleJoin}
              className="mt-4 w-full rounded-xl bg-stone-900 py-3 font-semibold text-white transition hover:bg-stone-800"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
