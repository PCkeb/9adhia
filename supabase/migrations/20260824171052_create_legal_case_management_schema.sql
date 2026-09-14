/*
# Legal Case Management System - Initial Schema

## Overview
Creates the complete database schema for a legal case and court session tracking system (نظام متابعة القضايا والجلسات القضائية). This is a multi-user authenticated application where all authenticated users share access to the same cases, persons, sessions, and attachments. Role-based access control (manager, employee, reader) is enforced at the application layer.

## New Tables

1. **profiles** - Extends Supabase auth.users with application-specific user metadata.
   - `id` (uuid, PK, references auth.users)
   - `full_name` (text) - full display name
   - `role` (text) - one of: 'manager', 'employee', 'reader'
   - `created_at` (timestamptz)

2. **persons** (المعنيون بالقضايا) - People involved in legal cases.
   - `id` (uuid, PK)
   - `registration_number` (text) - رقم القيد
   - `full_name` (text) - الاسم الكامل
   - `rank` (text) - الرتبة
   - `unit` (text) - الوحدة
   - `phone` (text) - رقم الهاتف
   - `email` (text, nullable) - البريد الإلكتروني
   - `address` (text, nullable) - العنوان
   - `notes` (text, nullable) - الملاحظات
   - `created_at`, `updated_at` (timestamptz)

3. **cases** (القضايا) - Legal cases.
   - `id` (uuid, PK)
   - `case_number` (text) - رقم القضية
   - `date` (date) - التاريخ
   - `person_id` (uuid, FK -> persons) - المعني بالقضية
   - `case_type` (text) - نوع القضية
   - `description` (text, nullable) - وصف القضية
   - `court` (text) - المحكمة
   - `judicial_authority` (text) - الجهة القضائية (محكمة، مجلس قضاء، محكمة عليا، محكمة إدارية)
   - `status` (text) - الحالة (سارية، مؤجلة، منجزة، ملغاة، استئناف، طعن)
   - `notes` (text, nullable) - ملاحظات
   - `created_at`, `updated_at` (timestamptz)

4. **sessions** (الجلسات) - Court sessions for cases.
   - `id` (uuid, PK)
   - `case_id` (uuid, FK -> cases, ON DELETE CASCADE)
   - `date` (date) - تاريخ الجلسة
   - `time` (time) - الساعة
   - `court` (text) - المحكمة
   - `room` (text, nullable) - القاعة
   - `judge` (text, nullable) - القاضي
   - `result` (text) - النتيجة (تأجيل، حكم، براءة، إدانة، استئناف، شطب، أخرى)
   - `notes` (text, nullable) - ملاحظات
   - `created_at`, `updated_at` (timestamptz)

5. **attachments** (المرفقات) - Files attached to cases.
   - `id` (uuid, PK)
   - `case_id` (uuid, FK -> cases, ON DELETE CASCADE)
   - `file_name` (text) - original file name
   - `file_path` (text) - storage path
   - `file_type` (text) - MIME type
   - `file_size` (bigint) - size in bytes
   - `category` (text) - تصنيف (استدعاء، حكم، قرار، محضر جلسة، استئناف، طعن، مراسلة، أخرى)
   - `created_at` (timestamptz)

6. **activities** (سجل العمليات) - Activity log for cases.
   - `id` (uuid, PK)
   - `case_id` (uuid, FK -> cases, ON DELETE CASCADE)
   - `user_id` (uuid, FK -> auth.users, nullable)
   - `action` (text) - description of the action
   - `created_at` (timestamptz)

## Security
- RLS enabled on all tables.
- All tables allow CRUD for authenticated users only (shared data model - all authenticated users work on the same cases).
- Storage bucket 'attachments' created for file uploads, accessible to authenticated users.

## Important Notes
1. All tables use `TO authenticated` policies since this is a multi-user app with a login screen.
2. Data is shared across all authenticated users (not per-user isolated) - this is a shared case management system.
3. Role-based restrictions (manager/employee/reader) are enforced at the application layer based on the `profiles.role` column.
4. A trigger automatically creates a profile row when a new auth user signs up.
5. An update trigger sets `updated_at` on row modification for persons, cases, and sessions.
*/

-- ============ PROFILES TABLE ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('manager', 'employee', 'reader')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'employee')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ PERSONS TABLE ============
CREATE TABLE IF NOT EXISTS persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text NOT NULL,
  full_name text NOT NULL,
  rank text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "persons_select_authenticated" ON persons;
CREATE POLICY "persons_select_authenticated" ON persons FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "persons_insert_authenticated" ON persons;
CREATE POLICY "persons_insert_authenticated" ON persons FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "persons_update_authenticated" ON persons;
CREATE POLICY "persons_update_authenticated" ON persons FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "persons_delete_authenticated" ON persons;
CREATE POLICY "persons_delete_authenticated" ON persons FOR DELETE
  TO authenticated USING (true);

-- ============ CASES TABLE ============
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  person_id uuid REFERENCES persons(id) ON DELETE SET NULL,
  case_type text NOT NULL DEFAULT '',
  description text,
  court text NOT NULL DEFAULT '',
  judicial_authority text NOT NULL DEFAULT 'محكمة',
  status text NOT NULL DEFAULT 'سارية' CHECK (status IN ('سارية', 'مؤجلة', 'منجزة', 'ملغاة', 'استئناف', 'طعن')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cases_select_authenticated" ON cases;
CREATE POLICY "cases_select_authenticated" ON cases FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "cases_insert_authenticated" ON cases;
CREATE POLICY "cases_insert_authenticated" ON cases FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "cases_update_authenticated" ON cases;
CREATE POLICY "cases_update_authenticated" ON cases FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cases_delete_authenticated" ON cases;
CREATE POLICY "cases_delete_authenticated" ON cases FOR DELETE
  TO authenticated USING (true);

-- ============ SESSIONS TABLE ============
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  date date NOT NULL,
  time text NOT NULL DEFAULT '',
  court text NOT NULL DEFAULT '',
  room text,
  judge text,
  result text NOT NULL DEFAULT 'تأجيل' CHECK (result IN ('تأجيل', 'حكم', 'براءة', 'إدانة', 'استئناف', 'شطب', 'أخرى')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_select_authenticated" ON sessions;
CREATE POLICY "sessions_select_authenticated" ON sessions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "sessions_insert_authenticated" ON sessions;
CREATE POLICY "sessions_insert_authenticated" ON sessions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "sessions_update_authenticated" ON sessions;
CREATE POLICY "sessions_update_authenticated" ON sessions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sessions_delete_authenticated" ON sessions;
CREATE POLICY "sessions_delete_authenticated" ON sessions FOR DELETE
  TO authenticated USING (true);

-- ============ ATTACHMENTS TABLE ============
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'أخرى' CHECK (category IN ('استدعاء', 'حكم', 'قرار', 'محضر جلسة', 'استئناف', 'طعن', 'مراسلة', 'أخرى')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attachments_select_authenticated" ON attachments;
CREATE POLICY "attachments_select_authenticated" ON attachments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "attachments_insert_authenticated" ON attachments;
CREATE POLICY "attachments_insert_authenticated" ON attachments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "attachments_update_authenticated" ON attachments;
CREATE POLICY "attachments_update_authenticated" ON attachments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "attachments_delete_authenticated" ON attachments;
CREATE POLICY "attachments_delete_authenticated" ON attachments FOR DELETE
  TO authenticated USING (true);

-- ============ ACTIVITIES TABLE ============
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select_authenticated" ON activities;
CREATE POLICY "activities_select_authenticated" ON activities FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "activities_insert_authenticated" ON activities;
CREATE POLICY "activities_insert_authenticated" ON activities FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "activities_delete_authenticated" ON activities;
CREATE POLICY "activities_delete_authenticated" ON activities FOR DELETE
  TO authenticated USING (true);

-- ============ UPDATED_AT TRIGGERS ============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS persons_updated_at ON persons;
CREATE TRIGGER persons_updated_at BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS cases_updated_at ON cases;
CREATE TRIGGER cases_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS sessions_updated_at ON sessions;
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_cases_person_id ON cases(person_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_court ON cases(court);
CREATE INDEX IF NOT EXISTS idx_sessions_case_id ON sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_attachments_case_id ON attachments(case_id);
CREATE INDEX IF NOT EXISTS idx_activities_case_id ON activities(case_id);

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attachments bucket
DROP POLICY IF EXISTS "attachments_bucket_select" ON storage.objects;
CREATE POLICY "attachments_bucket_select" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments_bucket_insert" ON storage.objects;
CREATE POLICY "attachments_bucket_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments_bucket_update" ON storage.objects;
CREATE POLICY "attachments_bucket_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'attachments') WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments_bucket_delete" ON storage.objects;
CREATE POLICY "attachments_bucket_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'attachments');
