/*
# Create app_settings table for print header configuration

1. New Tables
- `app_settings` - stores configurable system settings (print header)
  - `id` (int, PK, always 1 - singleton)
  - `print_header_title` (text) - main title shown on printed documents
  - `print_header_subtitle` (text) - subtitle shown below the title
  - `print_header_logo_text` (text) - short logo/organization text
  - `updated_at` (timestamptz)

2. Security
- RLS enabled on app_settings
- All authenticated users can read settings
- Only authenticated users can update (app-layer enforces manager-only)

3. Notes
- Singleton row (id=1) seeded with default values
- Used by the print layout to render a header on every printed page
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id int PRIMARY KEY DEFAULT 1,
  print_header_title text NOT NULL DEFAULT 'نظام متابعة القضايا والجلسات القضائية',
  print_header_subtitle text NOT NULL DEFAULT '',
  print_header_logo_text text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_authenticated" ON app_settings;
CREATE POLICY "settings_select_authenticated" ON app_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "settings_update_authenticated" ON app_settings;
CREATE POLICY "settings_update_authenticated" ON app_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "settings_insert_authenticated" ON app_settings;
CREATE POLICY "settings_insert_authenticated" ON app_settings FOR INSERT
  TO authenticated WITH CHECK (true);

INSERT INTO app_settings (id, print_header_title, print_header_subtitle, print_header_logo_text)
VALUES (1, 'نظام متابعة القضايا والجلسات القضائية', '', '')
ON CONFLICT (id) DO NOTHING;
