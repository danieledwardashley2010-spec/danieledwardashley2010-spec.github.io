import { useEffect, useState, useCallback } from 'react';
import { Trophy, Plus, ArrowRight, ArrowLeft, Users, Layers, Calendar, LogOut, MapPin, Pencil, X, Check, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Competition, RoundWithHunt, CompetitionTeamWithMembers } from '@/hunt/types';

interface Props {
  onCreateHunt: () => void;
  onJoinHunt: (code: string) => void;
  onStartTour: () => void;
}

export default function CompetitionsScreen({ onCreateHunt, onJoinHunt, onStartTour }: Props) {
  const { user, profile, signOut, updateDisplayName } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const fetchCompetitions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('competitions')
      .select('*')
      .eq('organiser_id', user.id)
      .order('created_at', { ascending: false });
    setCompetitions((data as Competition[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    const { data } = await supabase
      .from('competitions')
      .insert({
        name: newName.trim(),
        description: newDesc.trim() || null,
        organiser_id: user.id,
        status: 'draft',
      })
      .select()
      .maybeSingle();
    if (data) {
      setCompetitions([data as Competition, ...competitions]);
      setSelectedComp(data as Competition);
    }
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      setEditingName(false);
      return;
    }
    await updateDisplayName(nameValue.trim());
    setEditingName(false);
  };

  if (selectedComp) {
    return (
      <CompetitionDetail
        competition={selectedComp}
        onBack={() => {
          setSelectedComp(null);
          fetchCompetitions();
        }}
      />
    );
  }

  return (
    <div className="min-h-safe bg-stone-50 text-stone-900">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">My Competitions</h1>
              <p className="mt-0.5 text-xs text-stone-500">
                {profile?.display_name || user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Profile name editor */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Pencil className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-stone-900">Your display name</div>
            {editingName ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="rounded-lg border-2 border-stone-300 px-2 py-1 text-sm outline-none focus:border-stone-900"
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-xs font-bold text-stone-900">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-sm text-stone-600">{profile?.display_name || 'Not set'}</span>
                <button
                  onClick={() => {
                    setEditingName(true);
                    setNameValue(profile?.display_name ?? '');
                  }}
                  className="text-xs font-medium text-stone-400 hover:text-stone-900"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create new competition */}
        {showCreate ? (
          <div className="mb-6 rounded-2xl border-2 border-stone-900 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold">New competition</h2>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Competition name</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Daniel's Birthday Hunt-Off"
                className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
                autoFocus
              />
            </label>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-stone-700">Description (optional)</span>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                placeholder="What's this competition about?"
                className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 rounded-xl bg-stone-900 py-3 font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl px-4 py-3 font-medium text-stone-500 transition hover:bg-stone-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-white py-4 font-semibold text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
          >
            <Plus className="h-5 w-5" />
            New competition
          </button>
        )}

        {/* Competitions list */}
        {loading ? (
          <div className="py-12 text-center text-stone-400">Loading...</div>
        ) : competitions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white py-12 text-center">
            <Trophy className="mx-auto h-8 w-8 text-stone-300" />
            <p className="mt-3 text-stone-500">
              No competitions yet. Create one to organise teams and run multi-round hunts.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {competitions.map((comp) => (
              <button
                key={comp.id}
                onClick={() => setSelectedComp(comp)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:border-stone-900 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900 text-white">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-stone-900">{comp.name}</h3>
                  {comp.description && (
                    <p className="mt-0.5 text-sm text-stone-500">{comp.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(comp.created_at).toLocaleDateString()}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium uppercase tracking-wide">
                      {comp.status}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-stone-300 transition group-hover:translate-x-1 group-hover:text-stone-900" />
              </button>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-8 border-t border-stone-200 pt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Quick actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={onCreateHunt}
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-stone-900"
            >
              <MapPin className="h-5 w-5 text-amber-600" />
              <div>
                <div className="text-sm font-semibold">Create a single hunt</div>
                <div className="text-xs text-stone-500">Quick hunt without a competition</div>
              </div>
            </button>
            <button
              onClick={onStartTour}
              className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:bg-amber-100"
            >
              <Star className="h-5 w-5 text-amber-600" />
              <div>
                <div className="text-sm font-semibold text-amber-900">Take a guided tour</div>
                <div className="text-xs text-amber-700">See how it works</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Competition detail view ----

function CompetitionDetail({
  competition,
  onBack,
}: {
  competition: Competition;
  onBack: () => void;
}) {
  const [rounds, setRounds] = useState<RoundWithHunt[]>([]);
  const [teams, setTeams] = useState<CompetitionTeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#78716c');
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');

  const fetchRounds = useCallback(async () => {
    const { data } = await supabase
      .from('rounds')
      .select('*, hunts(code, status, config)')
      .eq('competition_id', competition.id)
      .order('round_number', { ascending: true });
    setRounds((data as RoundWithHunt[]) ?? []);
  }, [competition.id]);

  const fetchTeams = useCallback(async () => {
    const { data } = await supabase
      .from('competition_teams')
      .select('*, competition_team_members(*)')
      .eq('competition_id', competition.id)
      .order('created_at', { ascending: true });
    setTeams((data as CompetitionTeamWithMembers[]) ?? []);
  }, [competition.id]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchRounds(), fetchTeams()]);
      setLoading(false);
    })();
  }, [fetchRounds, fetchTeams]);

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return;
    await supabase.from('competition_teams').insert({
      competition_id: competition.id,
      name: newTeamName.trim(),
      color: newTeamColor,
    });
    setNewTeamName('');
    setShowAddTeam(false);
    fetchTeams();
  };

  const handleAddMember = async (teamId: string) => {
    if (!memberName.trim()) return;
    await supabase.from('competition_team_members').insert({
      competition_team_id: teamId,
      display_name: memberName.trim(),
    });
    setMemberName('');
    setAddingMember(null);
    fetchTeams();
  };

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from('competition_team_members').delete().eq('id', memberId);
    fetchTeams();
  };

  const handleRemoveTeam = async (teamId: string) => {
    await supabase.from('competition_teams').delete().eq('id', teamId);
    fetchTeams();
  };

  const handleDeleteRound = async (roundId: string) => {
    await supabase.from('rounds').delete().eq('id', roundId);
    fetchRounds();
  };

  const COLORS = ['#78716c', '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed', '#0891b2', '#db2777'];

  return (
    <div className="min-h-safe bg-stone-50 text-stone-900">
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-lg font-bold">{competition.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {competition.description && (
          <p className="mb-6 text-sm text-stone-600">{competition.description}</p>
        )}

        {loading ? (
          <div className="py-12 text-center text-stone-400">Loading...</div>
        ) : (
          <>
            {/* Teams section */}
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
                  <Users className="h-4 w-4" />
                  Teams ({teams.length})
                </h2>
                {!showAddTeam && (
                  <button
                    onClick={() => setShowAddTeam(true)}
                    className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900"
                  >
                    <Plus className="h-4 w-4" />
                    Add team
                  </button>
                )}
              </div>

              {showAddTeam && (
                <div className="mb-4 rounded-2xl border-2 border-stone-900 bg-white p-4 shadow-lg">
                  <input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Team name"
                    className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
                    autoFocus
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewTeamColor(c)}
                        className={`h-8 w-8 rounded-full transition ${newTeamColor === c ? 'ring-2 ring-stone-900 ring-offset-2' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleAddTeam}
                      disabled={!newTeamName.trim()}
                      className="flex-1 rounded-xl bg-stone-900 py-2.5 font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddTeam(false)}
                      className="rounded-xl px-4 py-2.5 font-medium text-stone-500 hover:bg-stone-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {teams.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white py-10 text-center">
                  <Users className="mx-auto h-8 w-8 text-stone-300" />
                  <p className="mt-3 text-sm text-stone-500">
                    No teams yet. Add teams and assign members before your rounds begin.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div key={team.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full" style={{ backgroundColor: team.color }} />
                          <span className="font-semibold">{team.name}</span>
                          <span className="text-sm text-stone-500">
                            {team.competition_team_members?.length ?? 0}{' '}
                            {team.competition_team_members?.length === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveTeam(team.id)}
                          className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {team.competition_team_members && team.competition_team_members.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {team.competition_team_members.map((m) => (
                            <span
                              key={m.id}
                              className="group flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600"
                            >
                              {m.display_name}
                              <button
                                onClick={() => handleRemoveMember(m.id)}
                                className="ml-1 text-stone-400 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {addingMember === team.id ? (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMember(team.id)}
                            placeholder="Member name"
                            className="flex-1 rounded-lg border-2 border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-stone-900"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddMember(team.id)}
                            className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-semibold text-white"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setAddingMember(null)}
                            className="text-sm text-stone-400 hover:text-stone-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingMember(team.id)}
                          className="mt-3 flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-stone-900"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add member
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rounds section */}
            <div className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
                <Layers className="h-4 w-4" />
                Rounds ({rounds.length})
              </h2>
              {rounds.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white py-10 text-center">
                  <Layers className="mx-auto h-8 w-8 text-stone-300" />
                  <p className="mt-3 text-sm text-stone-500">
                    No rounds yet. Create a hunt from the home screen, then add it as a round here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rounds.map((round) => (
                    <div
                      key={round.id}
                      className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 font-bold text-stone-700">
                        {round.round_number}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">
                          Round {round.round_number}
                        </div>
                        {round.hunts ? (
                          <div className="mt-0.5 text-sm text-stone-500">
                            Code: {round.hunts.code} · Status: {round.hunts.status}
                          </div>
                        ) : (
                          <div className="mt-0.5 text-sm text-stone-400">No hunt linked</div>
                        )}
                      </div>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
                        {round.status}
                      </span>
                      <button
                        onClick={() => handleDeleteRound(round.id)}
                        className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
