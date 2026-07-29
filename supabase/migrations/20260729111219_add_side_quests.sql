-- Side quests: optional bonus challenges teams can complete during a hunt
-- for extra flavour and bonus points. Stored per-hunt (shared across teams).

CREATE TABLE public.side_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id uuid NOT NULL REFERENCES public.hunts(id) ON DELETE CASCADE,
  quest_key text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  prompt text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  points integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.side_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_side_quests" ON public.side_quests FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_side_quests" ON public.side_quests FOR INSERT
  TO anon, authenticated WITH CHECK (hunt_id IS NOT NULL AND quest_key IS NOT NULL AND title IS NOT NULL);

CREATE POLICY "anon_update_side_quests" ON public.side_quests FOR UPDATE
  TO anon, authenticated
  USING (hunt_id IS NOT NULL)
  WITH CHECK (hunt_id IS NOT NULL);

CREATE POLICY "anon_delete_side_quests" ON public.side_quests FOR DELETE
  TO anon, authenticated USING (false);

-- Per-team side quest completion tracking
CREATE TABLE public.team_side_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  side_quest_id uuid NOT NULL REFERENCES public.side_quests(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  answer text,
  photo_url text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, side_quest_id)
);

ALTER TABLE public.team_side_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_team_side_quests" ON public.team_side_quests FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_team_side_quests" ON public.team_side_quests FOR INSERT
  TO anon, authenticated WITH CHECK (team_id IS NOT NULL AND side_quest_id IS NOT NULL);

CREATE POLICY "anon_update_team_side_quests" ON public.team_side_quests FOR UPDATE
  TO anon, authenticated
  USING (team_id IS NOT NULL)
  WITH CHECK (team_id IS NOT NULL);

CREATE POLICY "anon_delete_team_side_quests" ON public.team_side_quests FOR DELETE
  TO anon, authenticated USING (false);

-- Add display_name update support is already there via UPDATE policy on team_members.
-- Add an index for lookups
CREATE INDEX idx_side_quests_hunt ON public.side_quests(hunt_id);
CREATE INDEX idx_team_side_quests_team ON public.team_side_quests(team_id);
