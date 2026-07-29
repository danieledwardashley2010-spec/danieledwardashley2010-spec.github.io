import { useEffect, useState, useCallback } from 'react';
import { Users, Copy, Check, Play, RefreshCw, ArrowLeft, Share2, MapPin, X, Pencil, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { HuntConfig, TeamWithMembers } from '@/hunt/types';
import { THEME_LABELS, OCCASION_LABELS, generateTeamOrderings, getFinishLocation } from '@/hunt/builder';
import { LOCATIONS } from '@/hunt/locations';
import { removeMember, removeTeam, renameTeam, renameMember } from '@/lib/hostApi';

interface Props {
  huntId: string;
  huntCode: string;
  hostId: string;
  config: HuntConfig;
  isHost: boolean;
  onBack: () => void;
  onStart: () => void;
}

export default function LobbyScreen({ huntId, huntCode, hostId, config, isHost, onBack, onStart }: Props) {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sideQuestCount, setSideQuestCount] = useState(0);

  const fetchTeams = useCallback(async () => {
    const { data } = await supabase
      .from('teams')
      .select('*, team_members(*), team_stops(*)')
      .eq('hunt_id', huntId)
      .order('created_at', { ascending: true });
    if (data) setTeams(data as TeamWithMembers[]);
    setLoading(false);
  }, [huntId]);

  const fetchSideQuestCount = useCallback(async () => {
    const { data, error } = await supabase
      .from('side_quests')
      .select('id', { count: 'exact' })
      .eq('hunt_id', huntId);
    if (!error && data) setSideQuestCount((data as unknown[]).length);
  }, [huntId]);

  useEffect(() => {
    fetchTeams();
    fetchSideQuestCount();
    const channel = supabase
      .channel(`lobby-${huntId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `hunt_id=eq.${huntId}` }, () => fetchTeams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => fetchTeams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hunts', filter: `id=eq.${huntId}` }, (payload) => {
        if (payload.new && (payload.new as { status?: string }).status === 'active') {
          onStart();
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [huntId, fetchTeams, fetchSideQuestCount, onStart]);

  const shareUrl = `${window.location.origin}?join=${huntCode}`;
  const shareText = `Join my Liverpool scavenger hunt! Code: ${huntCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Liverpool Scavenger Hunt', text: shareText, url: shareUrl });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleStart = async () => {
    if (teams.length === 0) return;
    setStarting(true);

    const stopIds: string[] = (config.stop_ids ?? []) as string[];
    const pool = stopIds.length > 0
      ? stopIds.map((id) => LOCATIONS.find((l) => l.id === id)!).filter(Boolean)
      : LOCATIONS;
    const orderings = generateTeamOrderings(pool, teams.length);

    for (let i = 0; i < teams.length; i++) {
      const ordering = orderings[i % orderings.length];
      const stops = ordering.map((loc, idx) => ({
        team_id: teams[i].id,
        location_id: loc.id,
        order_index: idx,
        verified: false,
      }));
      await supabase.from('team_stops').insert(stops);
    }

    await supabase.from('hunts').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', huntId);
    setStarting(false);
    onStart();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isHost) return;
    await removeMember(huntId, hostId, memberId);
    fetchTeams();
  };

  const handleRemoveTeam = async (teamId: string) => {
    if (!isHost) return;
    await removeTeam(huntId, hostId, teamId);
    fetchTeams();
  };

  const handleSaveTeamName = async (teamId: string) => {
    if (!editValue.trim()) {
      setEditingTeamId(null);
      return;
    }
    await renameTeam(huntId, hostId, teamId, editValue.trim());
    setEditingTeamId(null);
    setEditValue('');
    fetchTeams();
  };

  const handleSaveMemberName = async (memberId: string) => {
    if (!editValue.trim()) {
      setEditingMemberId(null);
      return;
    }
    await renameMember(huntId, hostId, memberId, editValue.trim());
    setEditingMemberId(null);
    setEditValue('');
    fetchTeams();
  };

  const finishName = getFinishLocation(config).name;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          {isHost && (
            <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <h1 className="text-lg font-bold">Hunt lobby</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-stone-300">Hunt code</div>
              <div className="mt-1 text-4xl font-bold tracking-widest">{huntCode}</div>
            </div>
            <div className="text-right text-sm text-stone-300">
              <div>{THEME_LABELS[config.theme]}</div>
              <div>{config.length} · {config.difficulty}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-medium backdrop-blur transition hover:bg-white/20"
            >
              <Share2 className="h-4 w-4" />
              Share invite link
            </button>
            <button
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-medium backdrop-blur transition hover:bg-white/20"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
          <p className="mt-3 text-sm text-stone-300">
            Send this link to friends. They can join as teams — everyone visits the same places in a different order.
          </p>
        </div>

        {/* Side quest preview */}
        {sideQuestCount > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-stone-900">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">{sideQuestCount} side quests included</div>
              <div className="text-xs text-stone-600">Bonus challenges teams can complete during the hunt for extra points.</div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
            <Users className="h-4 w-4" />
            Teams ({teams.length})
          </h2>
          <button onClick={fetchTeams} className="text-stone-400 hover:text-stone-700">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {isHost && (
          <p className="mt-2 text-xs text-stone-500">
            As host you can rename teams and players, or remove anyone who shouldn't be here.
          </p>
        )}

        {loading ? (
          <div className="py-12 text-center text-stone-400">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-stone-300" />
            <p className="mt-3 text-stone-500">No teams yet. Share the link above to get people in.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {teams.map((team) => (
              <div key={team.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color }} />
                    {editingTeamId === team.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTeamName(team.id)}
                          className="rounded-lg border-2 border-stone-300 px-2 py-1 text-sm font-semibold outline-none focus:border-stone-900"
                          autoFocus
                        />
                        <button onClick={() => handleSaveTeamName(team.id)} className="text-xs font-bold text-stone-900">Save</button>
                      </div>
                    ) : (
                      <span className="font-semibold">{team.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-500">
                      {team.team_members?.length ?? 0} {team.team_members?.length === 1 ? 'player' : 'players'}
                    </span>
                    {isHost && (
                      <div className="flex items-center gap-1">
                        {editingTeamId !== team.id && (
                          <button
                            onClick={() => { setEditingTeamId(team.id); setEditValue(team.name); }}
                            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
                            title="Rename team"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveTeam(team.id)}
                          className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Remove team"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {team.team_members && team.team_members.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {team.team_members.map((m) => (
                      <span
                        key={m.id}
                        className="group flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600"
                      >
                        {editingMemberId === m.id ? (
                          <span className="flex items-center gap-1">
                            <input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveMemberName(m.id)}
                              className="w-20 rounded border border-stone-300 px-1 py-0.5 text-xs outline-none focus:border-stone-900"
                              autoFocus
                            />
                            <button onClick={() => handleSaveMemberName(m.id)} className="text-xs font-bold text-stone-900">OK</button>
                          </span>
                        ) : (
                          <>
                            {m.display_name}
                            {isHost && (
                              <span className="ml-1 flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                                <button
                                  onClick={() => { setEditingMemberId(m.id); setEditValue(m.display_name); }}
                                  className="text-stone-400 hover:text-stone-900"
                                  title="Rename"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(m.id)}
                                  className="text-stone-400 hover:text-red-600"
                                  title="Remove"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )}
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>
              Finish: <strong className="text-stone-900">{finishName}</strong> · Occasion: {OCCASION_LABELS[config.occasionType]} for {config.celebrantName}
            </span>
          </div>
        </div>

        {isHost && (
          <button
            onClick={handleStart}
            disabled={teams.length === 0 || starting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="h-5 w-5" />
            {starting ? 'Starting...' : `Start hunt (${teams.length} ${teams.length === 1 ? 'team' : 'teams'})`}
          </button>
        )}

        {!isHost && (
          <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center text-sm text-amber-800">
            Waiting for the host to start the hunt...
          </div>
        )}
      </div>
    </div>
  );
}
