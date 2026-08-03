/*
# Add authentication support: profiles, competitions, rounds, and pre-organized teams

## Overview
This migration adds the schema needed for signed-in users to organise teams in
advance and run multi-round scavenger hunt competitions.

## New Tables

1. `profiles`
   - Stores the display name and avatar URL for each authenticated user.
   - One row per auth.users entry, created on first sign-in.
   - Columns: id (uuid, PK, FK to auth.users), display_name (text), avatar_url (text), created_at.

2. `competitions`
   - A named competition created by a signed-in user (the "organiser").
   - Contains one or more rounds (each round is a hunt).
   - Columns: id, name, description, organiser_id (FK auth.users), status (draft/active/finished), created_at.

3. `rounds`
   - A single round within a competition. Each round is linked to a hunt (from the existing hunts table).
   - Tracks round number, status, and which hunt it maps to.
   - Columns: id, competition_id (FK), hunt_id (FK to existing hunts), round_number, status, created_at.

4. `competition_teams`
   - Teams that exist in the context of a competition, organised in advance by the organiser.
   - These teams can be pre-populated with members before any round starts.
   - When a round's hunt begins, these teams are carried into the hunt's `teams` table.
   - Columns: id, competition_id (FK), name, color, created_at.

5. `competition_team_members`
   - Named players assigned to a competition team, organised before the hunt.
   - Can optionally link to a registered user account (user_id) if the player has signed in.
   - Columns: id, competition_team_id (FK), user_id (FK auth.users, nullable), display_name, created_at.

## Security

### profiles
- RLS enabled.
- Users can read all profiles (needed to see team member names).
- Users can update/insert only their own profile row.

### competitions
- RLS enabled.
- Only the organiser can create/read/update/delete their own competitions.
- Uses `auth.uid()` for ownership checks.

### rounds
- RLS enabled.
- Only the competition organiser can manage rounds (checked via competition join).
- Any authenticated user can read rounds (so participants can see the schedule).

### competition_teams
- RLS enabled.
- Only the competition organiser can create/update/delete teams.
- Any authenticated user can read teams (so participants can see the lineup).

### competition_team_members
- RLS enabled.
- Only the competition organiser can add/remove members.
- Any authenticated user can read members.

## Important Notes
1. The existing hunts/teams/team_members tables keep their anon-open policies so
   the join-by-code flow continues to work for players who haven't signed in.
2. `competition_team_members.user_id` is nullable — a member can be a named
   placeholder ("John from accounting") without having an account.
3. `rounds.hunt_id` links each round to a hunt in the existing hunts table.
*/

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. competitions
CREATE TABLE IF NOT EXISTS competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  organiser_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "competitions_select_own" ON competitions;
CREATE POLICY "competitions_select_own" ON competitions FOR SELECT
  TO authenticated USING (auth.uid() = organiser_id);

DROP POLICY IF EXISTS "competitions_insert_own" ON competitions;
CREATE POLICY "competitions_insert_own" ON competitions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = organiser_id);

DROP POLICY IF EXISTS "competitions_update_own" ON competitions;
CREATE POLICY "competitions_update_own" ON competitions FOR UPDATE
  TO authenticated USING (auth.uid() = organiser_id) WITH CHECK (auth.uid() = organiser_id);

DROP POLICY IF EXISTS "competitions_delete_own" ON competitions;
CREATE POLICY "competitions_delete_own" ON competitions FOR DELETE
  TO authenticated USING (auth.uid() = organiser_id);

-- 3. rounds
CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  hunt_id uuid REFERENCES hunts(id) ON DELETE SET NULL,
  round_number int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, round_number)
);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rounds_select_organiser" ON rounds;
CREATE POLICY "rounds_select_organiser" ON rounds FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM competitions WHERE competitions.id = rounds.competition_id AND competitions.organiser_id = auth.uid())
  );

DROP POLICY IF EXISTS "rounds_insert_organiser" ON rounds;
CREATE POLICY "rounds_insert_organiser" ON rounds FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM competitions WHERE competitions.id = rounds.competition_id AND competitions.organiser_id = auth.uid())
  );

DROP POLICY IF EXISTS "rounds_update_organiser" ON rounds;
CREATE POLICY "rounds_update_organiser" ON rounds FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM competitions WHERE competitions.id = rounds.competition_id AND competitions.organiser_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM competitions WHERE competitions.id = rounds.competition_id AND competitions.organiser_id = auth.uid())
  );

DROP POLICY IF EXISTS "rounds_delete_organiser" ON rounds;
CREATE POLICY "rounds_delete_organiser" ON rounds FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM competitions WHERE competitions.id = rounds.competition_id AND competitions.organiser_id = auth.uid())
  );

-- 4. competition_teams
CREATE TABLE IF NOT EXISTS competition_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#78716c',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE competition_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comp_teams_select_organiser" ON competition_teams;
CREATE POLICY "comp_teams_select_organiser" ON competition_teams FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_teams.competition_id AND competitions.organiser_id = auth.uid())
  );

DROP POLICY IF EXISTS "comp_teams_insert_organiser" ON competition_teams;
CREATE POLICY "comp_teams_insert_organiser" ON competition_teams FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_teams.competition_id AND competitions.organiser_id = auth.uid())
  );

DROP POLICY IF EXISTS "comp_teams_update_organiser" ON competition_teams;
CREATE POLICY "comp_teams_update_organiser" ON competition_teams FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_teams.competition_id AND competitions.organiser_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_teams.competition_id AND competitions.organiser_id = auth.uid())
  );

DROP POLICY IF EXISTS "comp_teams_delete_organiser" ON competition_teams;
CREATE POLICY "comp_teams_delete_organiser" ON competition_teams FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_teams.competition_id AND competitions.organiser_id = auth.uid())
  );

-- 5. competition_team_members
CREATE TABLE IF NOT EXISTS competition_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_team_id uuid NOT NULL REFERENCES competition_teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE competition_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comp_team_members_select_organiser" ON competition_team_members;
CREATE POLICY "comp_team_members_select_organiser" ON competition_team_members FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM competition_teams
      JOIN competitions ON competitions.id = competition_teams.competition_id
      WHERE competition_teams.id = competition_team_members.competition_team_id
      AND competitions.organiser_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comp_team_members_insert_organiser" ON competition_team_members;
CREATE POLICY "comp_team_members_insert_organiser" ON competition_team_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM competition_teams
      JOIN competitions ON competitions.id = competition_teams.competition_id
      WHERE competition_teams.id = competition_team_members.competition_team_id
      AND competitions.organiser_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comp_team_members_update_organiser" ON competition_team_members;
CREATE POLICY "comp_team_members_update_organiser" ON competition_team_members FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM competition_teams
      JOIN competitions ON competitions.id = competition_teams.competition_id
      WHERE competition_teams.id = competition_team_members.competition_team_id
      AND competitions.organiser_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competition_teams
      JOIN competitions ON competitions.id = competition_teams.competition_id
      WHERE competition_teams.id = competition_team_members.competition_team_id
      AND competitions.organiser_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comp_team_members_delete_organiser" ON competition_team_members;
CREATE POLICY "comp_team_members_delete_organiser" ON competition_team_members FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM competition_teams
      JOIN competitions ON competitions.id = competition_teams.competition_id
      WHERE competition_teams.id = competition_team_members.competition_team_id
      AND competitions.organiser_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitions_organiser ON competitions(organiser_id);
CREATE INDEX IF NOT EXISTS idx_rounds_competition ON rounds(competition_id);
CREATE INDEX IF NOT EXISTS idx_comp_teams_competition ON competition_teams(competition_id);
CREATE INDEX IF NOT EXISTS idx_comp_team_members_team ON competition_team_members(competition_team_id);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
