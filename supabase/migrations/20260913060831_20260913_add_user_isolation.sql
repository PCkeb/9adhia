/*
# Per-User Data Isolation

## Overview
Transforms the shared data model into a per-user model where each authenticated user
has their own private set of persons, cases, sessions, attachments, activities, and settings.
No user can see or modify another user's data.

## Changes

### 1. Add `user_id` columns (nullable first, backfill, then NOT NULL)
- `persons.user_id` — owner of the person record
- `cases.user_id` — owner of the case
- `sessions.user_id` — owner of the session
- `attachments.user_id` — owner of the attachment
- `activities.user_id` — already exists, backfill nulls
- `app_settings.user_id` — per-user settings (replaces singleton id)

### 2. Backfill existing rows to the first user profile
### 3. Set columns NOT NULL with DEFAULT auth.uid()
### 4. Update all RLS policies to enforce per-user ownership
### 5. Update storage policies to scope by user_id in file path

## Security
- All tables now enforce per-user isolation via RLS.
- No user can SELECT, INSERT, UPDATE, or DELETE another user's data.
- profiles table remains shared (users can see other users' profiles for role awareness).
*/

-- ============ ADD user_id TO persons (nullable first) ============
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
DECLARE
  first_user uuid;
BEGIN
  SELECT id INTO first_user FROM profiles ORDER BY created_at LIMIT 1;
  IF first_user IS NOT NULL THEN
    UPDATE persons SET user_id = first_user WHERE user_id IS NULL;
  END IF;
END $$;

ALTER TABLE persons
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ============ ADD user_id TO cases ============
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
DECLARE
  first_user uuid;
BEGIN
  SELECT id INTO first_user FROM profiles ORDER BY created_at LIMIT 1;
  IF first_user IS NOT NULL THEN
    UPDATE cases SET user_id = first_user WHERE user_id IS NULL;
  END IF;
END $$;

ALTER TABLE cases
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ============ ADD user_id TO sessions ============
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
DECLARE
  first_user uuid;
BEGIN
  SELECT id INTO first_user FROM profiles ORDER BY created_at LIMIT 1;
  IF first_user IS NOT NULL THEN
    UPDATE sessions SET user_id = first_user WHERE user_id IS NULL;
  END IF;
END $$;

ALTER TABLE sessions
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ============ ADD user_id TO attachments ============
ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
DECLARE
  first_user uuid;
BEGIN
  SELECT id INTO first_user FROM profiles ORDER BY created_at LIMIT 1;
  IF first_user IS NOT NULL THEN
    UPDATE attachments SET user_id = first_user WHERE user_id IS NULL;
  END IF;
END $$;

ALTER TABLE attachments
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ============ BACKFILL activities.user_id ============
DO $$
DECLARE
  first_user uuid;
BEGIN
  SELECT id INTO first_user FROM profiles ORDER BY created_at LIMIT 1;
  IF first_user IS NOT NULL THEN
    UPDATE activities SET user_id = first_user WHERE user_id IS NULL;
  END IF;
END $$;

-- ============ app_settings: convert from singleton to per-user ============
ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
DECLARE
  first_user uuid;
BEGIN
  SELECT id INTO first_user FROM profiles ORDER BY created_at LIMIT 1;
  IF first_user IS NOT NULL THEN
    UPDATE app_settings SET user_id = first_user WHERE user_id IS NULL;
  END IF;
END $$;

ALTER TABLE app_settings
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Drop old PK and create new one on user_id
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_pkey;
ALTER TABLE app_settings ADD PRIMARY KEY (user_id);

-- Drop the old id column
ALTER TABLE app_settings DROP COLUMN IF EXISTS id;

-- ============ UPDATE RLS POLICIES ============

-- ---- PERSONS ----
DROP POLICY IF EXISTS "persons_select_authenticated" ON persons;
CREATE POLICY "persons_select_own" ON persons FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "persons_insert_authenticated" ON persons;
CREATE POLICY "persons_insert_own" ON persons FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "persons_update_authenticated" ON persons;
CREATE POLICY "persons_update_own" ON persons FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "persons_delete_authenticated" ON persons;
CREATE POLICY "persons_delete_own" ON persons FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---- CASES ----
DROP POLICY IF EXISTS "cases_select_authenticated" ON cases;
CREATE POLICY "cases_select_own" ON cases FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cases_insert_authenticated" ON cases;
CREATE POLICY "cases_insert_own" ON cases FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cases_update_authenticated" ON cases;
CREATE POLICY "cases_update_own" ON cases FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cases_delete_authenticated" ON cases;
CREATE POLICY "cases_delete_own" ON cases FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---- SESSIONS ----
DROP POLICY IF EXISTS "sessions_select_authenticated" ON sessions;
CREATE POLICY "sessions_select_own" ON sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_insert_authenticated" ON sessions;
CREATE POLICY "sessions_insert_own" ON sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_update_authenticated" ON sessions;
CREATE POLICY "sessions_update_own" ON sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_delete_authenticated" ON sessions;
CREATE POLICY "sessions_delete_own" ON sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---- ATTACHMENTS ----
DROP POLICY IF EXISTS "attachments_select_authenticated" ON attachments;
CREATE POLICY "attachments_select_own" ON attachments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "attachments_insert_authenticated" ON attachments;
CREATE POLICY "attachments_insert_own" ON attachments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "attachments_update_authenticated" ON attachments;
CREATE POLICY "attachments_update_own" ON attachments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "attachments_delete_authenticated" ON attachments;
CREATE POLICY "attachments_delete_own" ON attachments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---- ACTIVITIES ----
DROP POLICY IF EXISTS "activities_select_authenticated" ON activities;
CREATE POLICY "activities_select_own" ON activities FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_insert_authenticated" ON activities;
CREATE POLICY "activities_insert_own" ON activities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_delete_authenticated" ON activities;
CREATE POLICY "activities_delete_own" ON activities FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---- APP_SETTINGS (per-user) ----
DROP POLICY IF EXISTS "settings_select_authenticated" ON app_settings;
CREATE POLICY "settings_select_own" ON app_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "settings_insert_authenticated" ON app_settings;
CREATE POLICY "settings_insert_own" ON app_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "settings_update_authenticated" ON app_settings;
CREATE POLICY "settings_update_own" ON app_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ ADD INDEXES for user_id ============
CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

-- ============ UPDATE STORAGE POLICIES ============
-- Scope storage by user_id in file path: paths must start with the user's id
DROP POLICY IF EXISTS "attachments_bucket_select" ON storage.objects;
CREATE POLICY "attachments_bucket_select" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "attachments_bucket_insert" ON storage.objects;
CREATE POLICY "attachments_bucket_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "attachments_bucket_update" ON storage.objects;
CREATE POLICY "attachments_bucket_update" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "attachments_bucket_delete" ON storage.objects;
CREATE POLICY "attachments_bucket_delete" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
