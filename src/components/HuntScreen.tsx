import { useEffect, useState, useCallback, useRef } from 'react';
import { MapPin, Navigation, CheckCircle2, Eye, Compass, Trophy, Users, Crosshair, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { distanceMeters, formatDistance, VERIFY_RADIUS_M } from '@/lib/geo';
import type { HuntConfig, TeamStop, TeamWithMembers } from '@/hunt/types';
import { LOCATIONS } from '@/hunt/locations';
import { THEME_LABELS, getFinishLocation } from '@/hunt/builder';

interface Props {
  huntId: string;
  teamId: string;
  teamName: string;
  memberId: string;
  config: HuntConfig;
  onFinish: () => void;
  onLeave: () => void;
}

interface TeamProgress {
  teamId: string;
  teamName: string;
  color: string;
  verifiedCount: number;
  totalStops: number;
  finished: boolean;
}

export default function HuntScreen({ huntId, teamId, teamName, memberId, config, onFinish, onLeave }: Props) {
  const [stops, setStops] = useState<TeamStop[]>([]);
  const [allTeams, setAllTeams] = useState<TeamProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'success' | 'failed' | 'denied'>('idle');
  const [distToTarget, setDistToTarget] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [huntFinished, setHuntFinished] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const currentStep = stops.findIndex((s) => !s.verified);
  const isDone = currentStep === -1;
  const currentStop = isDone ? null : stops[currentStep];
  const currentLocation = currentStop
    ? (currentStop.location_id === 'custom-finish'
      ? getFinishLocation(config)
      : LOCATIONS.find((l) => l.id === currentStop.location_id))
    : null;

  const fetchStops = useCallback(async () => {
    const { data } = await supabase
      .from('team_stops')
      .select('*')
      .eq('team_id', teamId)
      .order('order_index', { ascending: true });
    if (data) {
      setStops(data as TeamStop[]);
      const allVerified = (data as TeamStop[]).every((s) => s.verified);
      if (allVerified && (data as TeamStop[]).length > 0 && !huntFinished) {
        setHuntFinished(true);
        await supabase
          .from('teams')
          .update({ finished_at: new Date().toISOString() })
          .eq('id', teamId);
        onFinish();
      }
    }
    setLoading(false);
  }, [teamId, huntFinished, onFinish]);

  const fetchAllTeams = useCallback(async () => {
    const { data } = await supabase
      .from('teams')
      .select('*, team_stops(*)')
      .eq('hunt_id', huntId);
    if (data) {
      const progress: TeamProgress[] = (data as TeamWithMembers[]).map((t) => ({
        teamId: t.id,
        teamName: t.name,
        color: t.color,
        verifiedCount: t.team_stops?.filter((s) => s.verified).length ?? 0,
        totalStops: t.team_stops?.length ?? 0,
        finished: (t.team_stops?.length ?? 0) > 0 && (t.team_stops?.every((s) => s.verified) ?? false),
      }));
      progress.sort((a, b) => b.verifiedCount - a.verifiedCount);
      setAllTeams(progress);
    }
  }, [huntId]);

  useEffect(() => {
    fetchStops();
    fetchAllTeams();
    const channel = supabase
      .channel(`hunt-${huntId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_stops', filter: `team_id=eq.${teamId}` }, () => fetchStops())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_stops' }, () => fetchAllTeams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `hunt_id=eq.${huntId}` }, () => fetchAllTeams())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [huntId, teamId, fetchStops, fetchAllTeams]);

  // GPS watching
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (currentLocation) {
          const d = distanceMeters(pos.coords.latitude, pos.coords.longitude, currentLocation.lat, currentLocation.lng);
          setDistToTarget(d);
          setGpsStatus(d <= VERIFY_RADIUS_M ? 'success' : 'checking');
        }
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [currentLocation?.id]);

  const handleVerify = async () => {
    if (!currentStop || !currentLocation) return;
    setVerifying(true);
    setGpsStatus('checking');

    if (!navigator.geolocation) {
      setGpsStatus('denied');
      setVerifying(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const d = distanceMeters(pos.coords.latitude, pos.coords.longitude, currentLocation.lat, currentLocation.lng);
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDistToTarget(d);

        if (d <= VERIFY_RADIUS_M) {
          setGpsStatus('success');
          await supabase
            .from('team_stops')
            .update({ verified: true, verified_at: new Date().toISOString() })
            .eq('id', currentStop.id);
          setRevealed(false);
          setVerifying(false);
        } else {
          setGpsStatus('failed');
          setVerifying(false);
        }
      },
      () => {
        setGpsStatus('denied');
        setVerifying(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <div className="flex min-h-screen items-center justify-center text-stone-400">Loading your hunt...</div>
      </div>
    );
  }

  if (isDone || huntFinished) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <Trophy className="h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold">All stops verified!</h1>
          <p className="mt-2 text-stone-600">Heading to the results...</p>
        </div>
      </div>
    );
  }

  const finishName = getFinishLocation(config).name;
  const isFinalStop = currentStop?.order_index === stops.length - 1;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Compass className="h-5 w-5 text-stone-700" />
            {teamName}
          </div>
          <button onClick={onLeave} className="text-xs font-medium text-stone-500 hover:text-stone-900">
            Leave
          </button>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Stop {currentStep + 1} of {stops.length}</span>
            <span>{THEME_LABELS[config.theme]}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-stone-900 transition-all duration-500"
              style={{ width: `${(currentStep / stops.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Live leaderboard */}
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Users className="h-3.5 w-3.5" />
            Live standings
          </h3>
          <div className="space-y-2">
            {allTeams.map((t, i) => (
              <div key={t.teamId} className="flex items-center gap-3">
                <span className={`w-5 text-sm font-bold ${i === 0 ? 'text-amber-500' : 'text-stone-400'}`}>{i + 1}</span>
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                <span className={`flex-1 text-sm ${t.teamId === teamId ? 'font-bold' : 'text-stone-600'}`}>
                  {t.teamName} {t.teamId === teamId && '(you)'}
                </span>
                <span className="text-sm text-stone-500">
                  {t.verifiedCount}/{t.totalStops}
                  {t.finished && <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-green-600" />}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Clue card */}
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-6 text-white">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-stone-300">
              <MapPin className="h-4 w-4" />
              {isFinalStop ? 'Final stop' : `Clue ${currentStep + 1}`}
            </div>
            <p className="mt-3 text-lg leading-relaxed">
              {currentLocation?.clues[config.difficulty]}
            </p>
          </div>

          <div className="p-6">
            {revealed ? (
              <div className="animate-fadeIn">
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">You're looking for</div>
                <div className="mt-1 text-2xl font-bold text-stone-900">{currentLocation?.name}</div>
                <p className="mt-2 text-stone-600">{currentLocation?.reveal}</p>
              </div>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-100 py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-200"
              >
                <Eye className="h-4 w-4" />
                Stuck? Reveal where you're headed
              </button>
            )}
          </div>
        </div>

        {/* GPS verification */}
        <div className="mt-6 rounded-3xl border-2 border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <Crosshair className="h-5 w-5" />
            GPS verification
          </h3>

          {gpsStatus === 'denied' && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Location access is blocked. Enable location permissions in your browser to verify you've arrived.
              </span>
            </div>
          )}

          {userPos && distToTarget !== null && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-50 p-4">
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Navigation className="h-4 w-4" />
                Distance to target
              </div>
              <div className={`text-lg font-bold ${distToTarget <= VERIFY_RADIUS_M ? 'text-green-600' : 'text-stone-900'}`}>
                {formatDistance(distToTarget)}
              </div>
            </div>
          )}

          {gpsStatus === 'success' && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              You're at the spot! Tap verify to confirm.
            </div>
          )}

          {gpsStatus === 'failed' && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>You're not close enough. Get within {VERIFY_RADIUS_M}m of {currentLocation?.name} and try again.</span>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={verifying || gpsStatus === 'denied'}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {verifying ? (
              <>Checking your location...</>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                {isFinalStop ? "We're at the finish!" : "We've found it"}
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-stone-400">
            Your phone's GPS checks you're within {VERIFY_RADIUS_M}m of the spot.
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Finish: <strong className="text-stone-900">{finishName}</strong></span>
          </div>
        </div>
      </main>
    </div>
  );
}
