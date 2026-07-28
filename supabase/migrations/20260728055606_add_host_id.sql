/*
# Add host_id column to hunts

1. Changes
- Add `host_id` (text) to `hunts` table. This is a client-generated random
  identifier stored in the host's browser localStorage. It identifies which
  browser created the hunt so only the host can start it.
2. Security
- No policy changes needed; existing anon policies already allow full CRUD.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hunts' AND column_name = 'host_id'
  ) THEN
    ALTER TABLE hunts ADD COLUMN host_id text;
  END IF;
END $$;
