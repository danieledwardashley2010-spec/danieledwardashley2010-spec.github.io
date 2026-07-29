import { supabase } from '@/lib/supabase';
import { pickSideQuests } from '@/hunt/sideQuests';
import type { HuntConfig } from '@/hunt/types';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-hunt`;

const headers = () => ({
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
});

export async function removeMember(huntId: string, hostId: string, memberId: string): Promise<boolean> {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ action: 'remove_member', huntId, hostId, memberId }),
  });
  return res.ok;
}

export async function removeTeam(huntId: string, hostId: string, teamId: string): Promise<boolean> {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ action: 'remove_team', huntId, hostId, teamId }),
  });
  return res.ok;
}

export async function renameTeam(huntId: string, hostId: string, teamId: string, newName: string): Promise<boolean> {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ action: 'rename_team', huntId, hostId, teamId, newName }),
  });
  return res.ok;
}

export async function renameMember(huntId: string, hostId: string, memberId: string, newName: string): Promise<boolean> {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ action: 'rename_member', huntId, hostId, memberId, newName }),
  });
  return res.ok;
}

/** Create side quests for a hunt in the database. */
export async function seedSideQuests(huntId: string, config: HuntConfig): Promise<void> {
  const templates = pickSideQuests(config.theme, 4);
  const rows = templates.map((t) => ({
    hunt_id: huntId,
    quest_key: t.key,
    title: t.title,
    description: t.description,
    prompt: t.prompt,
    category: t.category,
    points: t.points,
  }));

  const { error } = await supabase.from('side_quests').insert(rows);
  if (error) {
    console.error('Failed to seed side quests:', error);
  }
}
