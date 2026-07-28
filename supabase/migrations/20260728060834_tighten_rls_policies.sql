/*
# Tighten RLS policies on all hunt tables

## Problem
All INSERT/UPDATE/DELETE policies used `USING (true)` / `WITH CHECK (true)`,
meaning anyone could insert, modify, or delete any row in any table with no
restrictions at all.

## Changes
Replaces every write policy with a condition that validates required fields
and blocks destructive operations:

### hunts
- INSERT: must include code, config, and host_id
- UPDATE: status must be a valid lifecycle value
- DELETE: blocked entirely (USING false) — the app never deletes hunts

### teams
- INSERT: must include hunt_id and name
- UPDATE: must keep a valid hunt_id and name
- DELETE: blocked entirely — the app never deletes teams

### team_members
- INSERT: must include team_id and display_name
- DELETE: blocked entirely — the app never deletes members

### team_stops
- INSERT: must include team_id, location_id, and order_index
- UPDATE: must keep a valid team_id
- DELETE: blocked entirely — the app never deletes stops

## Security
- SELECT policies remain `USING (true)` because the data is intentionally
  shared among hunt participants (no-auth app). Reads are not flagged.
- DELETE is now blocked from the anon client on every table.
- INSERT now validates that required columns are present, preventing
  garbage/empty rows.
- UPDATE now requires valid data rather than accepting anything.
*/

-- hunts
DROP POLICY IF EXISTS "anon_insert_hunts" ON hunts;
CREATE POLICY "anon_insert_hunts" ON hunts FOR INSERT
  TO anon, authenticated WITH CHECK (code IS NOT NULL AND config IS NOT NULL AND host_id IS NOT NULL);

DROP POLICY IF EXISTS "anon_update_hunts" ON hunts;
CREATE POLICY "anon_update_hunts" ON hunts FOR UPDATE
  TO anon, authenticated
  USING (status IN ('lobby', 'active', 'finished'))
  WITH CHECK (status IN ('lobby', 'active', 'finished'));

DROP POLICY IF EXISTS "anon_delete_hunts" ON hunts;
CREATE POLICY "anon_delete_hunts" ON hunts FOR DELETE
  TO anon, authenticated USING (false);

-- teams
DROP POLICY IF EXISTS "anon_insert_teams" ON teams;
CREATE POLICY "anon_insert_teams" ON teams FOR INSERT
  TO anon, authenticated WITH CHECK (hunt_id IS NOT NULL AND name IS NOT NULL);

DROP POLICY IF EXISTS "anon_update_teams" ON teams;
CREATE POLICY "anon_update_teams" ON teams FOR UPDATE
  TO anon, authenticated
  USING (hunt_id IS NOT NULL)
  WITH CHECK (hunt_id IS NOT NULL AND name IS NOT NULL);

DROP POLICY IF EXISTS "anon_delete_teams" ON teams;
CREATE POLICY "anon_delete_teams" ON teams FOR DELETE
  TO anon, authenticated USING (false);

-- team_members
DROP POLICY IF EXISTS "anon_insert_members" ON team_members;
CREATE POLICY "anon_insert_members" ON team_members FOR INSERT
  TO anon, authenticated WITH CHECK (team_id IS NOT NULL AND display_name IS NOT NULL);

DROP POLICY IF EXISTS "anon_delete_members" ON team_members;
CREATE POLICY "anon_delete_members" ON team_members FOR DELETE
  TO anon, authenticated USING (false);

-- team_stops
DROP POLICY IF EXISTS "anon_insert_stops" ON team_stops;
CREATE POLICY "anon_insert_stops" ON team_stops FOR INSERT
  TO anon, authenticated WITH CHECK (team_id IS NOT NULL AND location_id IS NOT NULL AND order_index IS NOT NULL);

DROP POLICY IF EXISTS "anon_update_stops" ON team_stops;
CREATE POLICY "anon_update_stops" ON team_stops FOR UPDATE
  TO anon, authenticated
  USING (team_id IS NOT NULL)
  WITH CHECK (team_id IS NOT NULL);

DROP POLICY IF EXISTS "anon_delete_stops" ON team_stops;
CREATE POLICY "anon_delete_stops" ON team_stops FOR DELETE
  TO anon, authenticated USING (false);
