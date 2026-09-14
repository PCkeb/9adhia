import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface AppSettings {
  print_header_title: string;
  print_header_subtitle: string;
  print_header_logo_text: string;
  header_line1: string;
  header_line2: string;
  header_line3: string;
  header_line4: string;
  header_line5: string;
  header_line6: string;
  header_date_text: string;
  header_ref_text: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  print_header_title: 'نظام متابعة القضايا والجلسات القضائية',
  print_header_subtitle: '',
  print_header_logo_text: '',
  header_line1: 'الجمهوريـــة الجزائريــــة الديمقراطيــــة الشعبيـــــة',
  header_line2: 'وزارة الداخليــــة والجــماعـــات المحليـة و النقل',
  header_line3: 'المديريــة العامـة للحمـايـــة المدنيـــة',
  header_line4: 'مديرية الحمايــة المدنيــة لولايـــة المـــديـة',
  header_line5: 'وحــــدة قطــاع الحمايـــة المدنيـة مجبــر',
  header_line6: 'شهيــــد الـــــــواجــــــب يحيـــاوي سمـــاعين',
  header_date_text: '',
  header_ref_text: '',
};

let cachedSettings: AppSettings | null = null;

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(cachedSettings ?? DEFAULT_SETTINGS);

  useEffect(() => {
    if (cachedSettings) return;
    (async () => {
      const { data } = await supabase.from('app_settings').select('*').maybeSingle();
      if (data) {
        const s = mapRow(data);
        cachedSettings = s;
        setSettings(s);
      } else {
        await ensureSettingsRow();
        const { data: retry } = await supabase.from('app_settings').select('*').maybeSingle();
        if (retry) {
          const s = mapRow(retry);
          cachedSettings = s;
          setSettings(s);
        }
      }
    })();
  }, []);

  return settings;
}

export async function getPrintSettings(): Promise<AppSettings> {
  if (cachedSettings) return cachedSettings;
  const { data } = await supabase.from('app_settings').select('*').maybeSingle();
  if (data) {
    cachedSettings = mapRow(data);
    return cachedSettings;
  }
  await ensureSettingsRow();
  const { data: retry } = await supabase.from('app_settings').select('*').maybeSingle();
  if (retry) {
    cachedSettings = mapRow(retry);
    return cachedSettings;
  }
  return DEFAULT_SETTINGS;
}

export async function updateSettings(s: AppSettings) {
  const { data: existing } = await supabase.from('app_settings').select('user_id').maybeSingle();
  const payload = {
    print_header_title: s.print_header_title,
    print_header_subtitle: s.print_header_subtitle,
    print_header_logo_text: s.print_header_logo_text,
    header_line1: s.header_line1,
    header_line2: s.header_line2,
    header_line3: s.header_line3,
    header_line4: s.header_line4,
    header_line5: s.header_line5,
    header_line6: s.header_line6,
    header_date_text: s.header_date_text,
    header_ref_text: s.header_ref_text,
  };
  if (existing) {
    await supabase.from('app_settings').update(payload).eq('user_id', existing.user_id);
  } else {
    await supabase.from('app_settings').insert(payload);
  }
  cachedSettings = s;
}

async function ensureSettingsRow() {
  await supabase.from('app_settings').insert({
    print_header_title: DEFAULT_SETTINGS.print_header_title,
    print_header_subtitle: '',
    print_header_logo_text: '',
    header_line1: DEFAULT_SETTINGS.header_line1,
    header_line2: DEFAULT_SETTINGS.header_line2,
    header_line3: DEFAULT_SETTINGS.header_line3,
    header_line4: DEFAULT_SETTINGS.header_line4,
    header_line5: DEFAULT_SETTINGS.header_line5,
    header_line6: DEFAULT_SETTINGS.header_line6,
    header_date_text: '',
    header_ref_text: '',
  });
}

function mapRow(data: any): AppSettings {
  return {
    print_header_title: data.print_header_title ?? '',
    print_header_subtitle: data.print_header_subtitle ?? '',
    print_header_logo_text: data.print_header_logo_text ?? '',
    header_line1: data.header_line1 ?? '',
    header_line2: data.header_line2 ?? '',
    header_line3: data.header_line3 ?? '',
    header_line4: data.header_line4 ?? '',
    header_line5: data.header_line5 ?? '',
    header_line6: data.header_line6 ?? '',
    header_date_text: data.header_date_text ?? '',
    header_ref_text: data.header_ref_text ?? '',
  };
}
