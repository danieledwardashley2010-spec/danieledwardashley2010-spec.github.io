import { useEffect, useState, useCallback } from 'react';
import { Trophy, MapPin, RotateCcw, Home, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { HuntConfig, TeamWithMembers } from '@/hunt/types';
import { getFinishLocation } from '@/hunt/builder';

interface Props {
  huntId: string;
  config: HuntConfig;
  teamId: string;
  onRestart: () => void;
  onHome: () => void;
}

interface TeamResult {
  teamId: string;
  teamName: string;
  color: string;
  verifiedCount: number;
  totalStops: number;
  finished: boolean;
  finishedAt: string | null;
  finishTimeMs: number | null;
  rank: number;
}

export default function FinishScreen({ huntId, config, teamId, onRestart, onHome }: Props) {
  const [results, setResults] = useState<TeamResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    const { data } = await supabase
      .from('teams')
      .select('*, team_stops(*)')
      .eq('hunt_id', huntId);
    if (data) {
      const teams = data as TeamWithMembers[];
      const teamResults: TeamResult[] = teams.map((t) => {
        const stops = t.team_stops ?? [];
        const verifiedCount = stops.filter((s) => s.verified).length;
        const finished = stops.length > 0 && stops.every((s) => s.verified);
        const lastVerified = stops
          .filter((s) => s.verified_at)
          .sort((a, b) => new Date(b.verified_at!).getTime() - new Date(a.verified_at!).getTime())[0];
        return {
          teamId: t.id,
          teamName: t.name,
          color: t.color,
          verifiedCount,
          totalStops: stops.length,
          finished,
          finishedAt: t.finished_at ?? lastVerified?.verified_at ?? null,
          finishTimeMs: t.finish_time_ms ?? null,
          rank: 0,
        };
      });

      teamResults.sort((a, b) => {
        if (a.finished && b.finished) {
          const aTime = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
          const bTime = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
          return aTime - bTime;
        }
        if (a.finished) return -1;
        if (b.finished) return 1;
        return b.verifiedCount - a.verifiedCount;
      });

      teamResults.forEach((r, i) => {
        r.rank = i + 1;
      });

      setResults(teamResults);
    }
    setLoading(false);
  }, [huntId]);

  useEffect(() => {
    fetchResults();
    const channel = supabase
      .channel(`results-${huntId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_stops' }, () => fetchResults())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `hunt_id=eq.${huntId}` }, () => fetchResults())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [huntId, fetchResults]);

  const myResult = results.find((r) => r.teamId === teamId);
  const finishName = getFinishLocation(config).name;
  const rankSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <div className="flex min-h-screen items-center justify-center text-stone-400">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-400 text-stone-900 shadow-2xl">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {config.occasionTitle} for {config.celebrantName}!
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-stone-200">
            {config.finalMessage}
          </p>
        </div>

        {myResult && (
          <div className="mt-8 rounded-3xl bg-white/5 p-6 text-center backdrop-blur">
            <div className="text-sm text-stone-300">Your team finished</div>
            <div className="mt-1 text-3xl font-bold text-amber-400">{rankSuffix(myResult.rank)}</div>
            <div className="mt-1 text-sm text-stone-300">
              {myResult.verifiedCount} of {myResult.totalStops} stops verified
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="mt-8 rounded-3xl bg-white/5 p-6 backdrop-blur">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-300">
            <Trophy className="h-4 w-4" />
            Final standings
          </h2>
          {results.length === 0 ? (
            <p className="text-sm text-stone-400">No results yet.</p>
          ) : (
            <div className="space-y-3">
              {results.map((r) => (
                <div
                  key={r.teamId}
                  className={`flex items-center gap-4 rounded-2xl p-4 ${
                    r.teamId === teamId ? 'bg-white/15 ring-2 ring-amber-400' : 'bg-white/5'
                  }`}
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                    r.rank === 1 ? 'bg-amber-400 text-stone-900' : r.rank === 2 ? 'bg-stone-300 text-stone-900' : r.rank === 3 ? 'bg-amber-700 text-white' : 'bg-white/10 text-stone-300'
                  }`}>
                    {r.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="font-semibold">{r.teamName}</span>
                      {r.teamId === teamId && <span className="text-xs text-amber-400">(you)</span>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-sm text-stone-300">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {r.verifiedCount}/{r.totalStops}
                      </span>
                      {r.finished && r.finishedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(r.finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.finished && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-stone-400">
          <MapPin className="h-4 w-4" />
          Finished at {finishName} · Liverpool City Centre
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-4 font-semibold text-stone-900 transition hover:bg-stone-100"
          >
            <RotateCcw className="h-5 w-5" />
            New hunt
          </button>
          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Home className="h-5 w-5" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
