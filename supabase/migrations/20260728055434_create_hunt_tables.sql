/*
# Create multiplayer scavenger hunt tables (single-tenant, no auth)

1. New Tables
- `hunts`: A single configured scavenger hunt. Holds the shareable code, the
  host's configuration (length, theme, difficulty, finish location, occasion
  text, celebrant name, final message), the shared set of stop location ids,
  and the hunt lifecycle status (lobby -> active -> finished).
- `teams`: A team participating in a hunt. Tracks team name, colour, and
  finish time/rank once the hunt completes.
- `team_members`: A named player belonging to a team.
- `team_stops`: The ordered list of stops a given team must visit. Every team
  in a hunt visits the same set of locations but in a different order, so each
  team has its own ordering. Tracks verification status per stop.

2. Security
- This is a no-auth single-tenant app: anyone with a hunt code can join and
  play. All policies use `TO anon, authenticated` with `USING (true)` /
  `WITH CHECK (true)` because the data is intentionally shared among
  participants of a hunt.
- RLS is enabled on every table so the tables are not accessible to any other
  roles.

3. Important Notes
- `hunts.code` is a short unique shareable string used in join links.
- `hunts.status` is one of: 'lobby', 'active', 'finished'.
- `hunts.stop_ids` is a jsonb array of location ids chosen for this hunt.
- `team_stops.order_index` is 0-based; the final stop (finish) is always the
  highest index for every team.
*/

CREATE TABLE IF NOT EXISTS hunts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  config jsonb NOT NULL,
  stop_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'lobby',
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

ALTER TABLE hunts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_hunts" ON hunts;
CREATE POLICY "anon_select_hunts" ON hunts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_hunts" ON hunts;
CREATE POLICY "anon_insert_hunts" ON hunts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_hunts" ON hunts;
CREATE POLICY "anon_update_hunts" ON hunts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_hunts" ON hunts;
CREATE POLICY "anon_delete_hunts" ON hunts FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id uuid NOT NULL REFERENCES hunts(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#0c0a09',
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  finish_time_ms bigint
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_teams" ON teams;
CREATE POLICY "anon_select_teams" ON teams FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
CREATE POLICY "anon_insert_teams" ON teams FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_teams" ON teams;
CREATE POLICY "anon_update_teams" ON teams FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
CREATE POLICY "anon_delete_teams" ON teams FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_members" ON team_members;
CREATE POLICY "anon_select_members" ON team_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_members" ON team_members;
CREATE POLICY "anon_insert_members" ON team_members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_members" ON team_members;
CREATE POLICY "anon_delete_members" ON team_members FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS team_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  location_id text NOT NULL,
  order_index int NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  UNIQUE (team_id, order_index)
);

ALTER TABLE team_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_stops" ON team_stops;
CREATE POLICY "anon_select_stops" ON team_stops FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_stops" ON team_stops;
CREATE POLICY "anon_insert_stops" ON team_stops FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_stops" ON team_stops;
CREATE POLICY "anon_update_stops" ON team_stops FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_stops" ON team_stops;
CREATE POLICY "anon_delete_stops" ON team_stops FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_teams_hunt_id ON teams(hunt_id);
CREATE INDEX IF NOT EXISTS idx_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_stops_team_id ON team_stops(team_id);
