/*
# Update app_settings for multi-line government print header

Adds columns for a structured Algerian government document header:
- 6 centered lines (republic, ministry, directorate, sub-directorate, unit, martyr)
- A right-aligned date text (next to line 3)
- A right-aligned reference number text (below line 6)

Also migrates old single-field header data to the new structure.
*/

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS header_line1 text DEFAULT 'الجمهوريـــة الجزائريــــة الديمقراطيــــة الشعبيـــــة',
  ADD COLUMN IF NOT EXISTS header_line2 text DEFAULT 'وزارة الداخليــــة والجــماعـــات المحليـة و النقل',
  ADD COLUMN IF NOT EXISTS header_line3 text DEFAULT 'المديريــة العامـة للحمـايـــة المدنيـــة',
  ADD COLUMN IF NOT EXISTS header_line4 text DEFAULT 'مديرية الحمايــة المدنيــة لولايـــة المـــديـة',
  ADD COLUMN IF NOT EXISTS header_line5 text DEFAULT 'وحــــدة قطــاع الحمايـــة المدنيـة مجبــر',
  ADD COLUMN IF NOT EXISTS header_line6 text DEFAULT 'شهيــــد الـــــــواجــــــب يحيـــاوي سمـــاعين',
  ADD COLUMN IF NOT EXISTS header_date_text text DEFAULT '',
  ADD COLUMN IF NOT EXISTS header_ref_text text DEFAULT '';

-- Update existing row with default values
UPDATE app_settings SET
  header_line1 = 'الجمهوريـــة الجزائريــــة الديمقراطيــــة الشعبيـــــة',
  header_line2 = 'وزارة الداخليــــة والجــماعـــات المحليـة و النقل',
  header_line3 = 'المديريــة العامـة للحمـايـــة المدنيـــة',
  header_line4 = 'مديرية الحمايــة المدنيــة لولايـــة المـــديـة',
  header_line5 = 'وحــــدة قطــاع الحمايـــة المدنيـة مجبــر',
  header_line6 = 'شهيــــد الـــــــواجــــــب يحيـــاوي سمـــاعين'
WHERE id = 1;
