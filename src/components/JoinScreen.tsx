import { useState, useEffect } from 'react';
import { Users, ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { TeamWithMembers } from '@/hunt/types';

interface Props {
  huntCode: string;
  onJoined: (teamId: string, teamName: string, memberId: string) => void;
  onBack: () => void;
}

const TEAM_COLORS = [
  '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed', '#0891b2', '#db2777', '#ea580c',
];

export default function JoinScreen({ huntCode, onJoined, onBack }: Props) {
  const [hunt, setHunt] = useState<{ id: string; status: string } | null>(null);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'choose' | 'create'>('choose');
  const [newTeamName, setNewTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);

  const loadHunt = async () => {
    const { data: huntData, error: huntErr } = await supabase
      .from('hunts')
      .select('id, status')
      .eq('code', huntCode)
      .maybeSingle();
    if (huntErr || !huntData) {
      setError('Hunt not found. Check the code and try again.');
      setLoading(false);
      return;
    }
    setHunt(huntData as { id: string; status: string });
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*, team_members(*)')
      .eq('hunt_id', (huntData as { id: string }).id)
      .order('created_at', { ascending: true });
    if (teamsData) setTeams(teamsData as TeamWithMembers[]);
    setLoading(false);
  };

  useEffect(() => {
    loadHunt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoinTeam = async (teamId: string) => {
    if (!playerName.trim()) {
      setError('Enter your name first.');
      return;
    }
    setJoiningTeamId(teamId);
    const { data, error: insErr } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, display_name: playerName.trim() })
      .select()
      .maybeSingle();
    if (insErr || !data) {
      setError('Could not join team. Try again.');
      setJoiningTeamId(null);
      return;
    }
    const team = teams.find((t) => t.id === teamId);
    onJoined(teamId, team?.name ?? 'Team', (data as { id: string }).id);
  };

  const handleCreateTeam = async () => {
    if (!playerName.trim() || !newTeamName.trim()) {
      setError('Enter your name and a team name.');
      return;
    }
    if (!hunt) return;
    const color = TEAM_COLORS[teams.length % TEAM_COLORS.length];
    const { data: teamData, error: teamErr } = await supabase
      .from('teams')
      .insert({ hunt_id: hunt.id, name: newTeamName.trim(), color })
      .select()
      .maybeSingle();
    if (teamErr || !teamData) {
      setError('Could not create team. Try again.');
      return;
    }
    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: (teamData as { id: string }).id, display_name: playerName.trim() });
    if (memberErr) {
      setError('Could not add you to the team. Try again.');
      return;
    }
    const { data: memberData } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', (teamData as { id: string }).id)
      .eq('display_name', playerName.trim())
      .maybeSingle();
    onJoined((teamData as { id: string }).id, newTeamName.trim(), (memberData as { id: string })?.id ?? '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <div className="flex min-h-screen items-center justify-center text-stone-400">Loading...</div>
      </div>
    );
  }

  if (error && !hunt) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <p className="text-lg font-semibold text-red-600">{error}</p>
          <button onClick={onBack} className="mt-4 flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-lg font-bold">Join hunt {huntCode}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Your name</span>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
            placeholder="Enter your name"
          />
        </label>

        {mode === 'choose' ? (
          <>
            <h2 className="mt-8 mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
              <Users className="h-4 w-4" />
              Join an existing team
            </h2>
            {teams.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white py-8 text-center text-stone-500">
                No teams yet. Be the first to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleJoinTeam(team.id)}
                    disabled={joiningTeamId !== null}
                    className="flex w-full items-center justify-between rounded-2xl border-2 border-stone-200 bg-white p-4 text-left transition hover:border-stone-900 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="font-semibold">{team.name}</span>
                    </div>
                    <span className="text-sm text-stone-500">
                      {team.team_members?.length ?? 0} {team.team_members?.length === 1 ? 'player' : 'players'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setMode('create')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-900 bg-white py-4 font-semibold text-stone-900 transition hover:bg-stone-100"
            >
              <Plus className="h-5 w-5" />
              Create a new team
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Create a team</h2>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Team name</span>
              <input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
                placeholder="e.g. The Scousers"
              />
            </label>
            <button
              onClick={handleCreateTeam}
              className="mt-4 w-full rounded-2xl bg-stone-900 py-4 font-semibold text-white shadow-lg transition hover:bg-stone-800"
            >
              Create & join team
            </button>
            <button
              onClick={() => setMode('choose')}
              className="mt-3 w-full text-center text-sm font-medium text-stone-500 hover:text-stone-900"
            >
              Back to team list
            </button>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
