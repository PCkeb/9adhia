import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, User, Printer } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { PageLoader } from '@/components/Feedback';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useSettings, updateSettings, type AppSettings } from '@/lib/settings';

export function SettingsPage() {
  const { profile, session } = useAuth();
  const settings = useSettings();
  const [fullName, setFullName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const [h1, setH1] = useState('');
  const [h2, setH2] = useState('');
  const [h3, setH3] = useState('');
  const [h4, setH4] = useState('');
  const [h5, setH5] = useState('');
  const [h6, setH6] = useState('');
  const [dateText, setDateText] = useState('');
  const [refText, setRefText] = useState('');
  const [savingPrint, setSavingPrint] = useState(false);
  const [savedPrint, setSavedPrint] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    setH1(settings.header_line1);
    setH2(settings.header_line2);
    setH3(settings.header_line3);
    setH4(settings.header_line4);
    setH5(settings.header_line5);
    setH6(settings.header_line6);
    setDateText(settings.header_date_text);
    setRefText(settings.header_ref_text);
  }, [settings]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile?.id);
    await supabase.auth.updateUser({ data: { full_name: fullName } });
    setSavingProfile(false);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 3000);
  }

  async function handleSavePrint() {
    setSavingPrint(true);
    const s: AppSettings = {
      ...settings,
      header_line1: h1, header_line2: h2, header_line3: h3,
      header_line4: h4, header_line5: h5, header_line6: h6,
      header_date_text: dateText, header_ref_text: refText,
    };
    await updateSettings(s);
    setSavingPrint(false);
    setSavedPrint(true);
    setTimeout(() => setSavedPrint(false), 3000);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="الإعدادات" subtitle="إدارة حسابك الشخصي وإعدادات النظام" />

      <div className="max-w-3xl space-y-6">
        {/* Profile Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={20} className="text-primary-500" />
            <h3 className="font-bold text-neutral-800">المعلومات الشخصية</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">الاسم الكامل</label>
              <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="الاسم الكامل" />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input className="input bg-neutral-50" value={session?.user?.email ?? ''} disabled dir="ltr" />
              <p className="text-xs text-neutral-400 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button className="btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? 'جاري الحفظ...' : <><Save size={16} /> حفظ التغييرات</>}
              </button>
              {savedProfile && <span className="text-sm text-success-600 animate-fade-in">تم الحفظ بنجاح</span>}
            </div>
          </div>
        </div>

        {/* Print Header Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Printer size={20} className="text-primary-500" />
            <h3 className="font-bold text-neutral-800">رأس الصفحة للطباعة</h3>
          </div>
          <p className="text-sm text-neutral-500 mb-4">
            يظهر هذا الرأس أعلى كل ورقة مطبوعة. الأسطر الستة تظهر في الوسط، التاريخ يظهر على اليسار بجانب السطر الثالث، ورقم المرجع يظهر على اليمين في الأسفل.
          </p>

          <div className="space-y-3">
            <div>
              <label className="label">السطر الأول (في الوسط)</label>
              <input className="input" value={h1} onChange={e => setH1(e.target.value)} placeholder="الجمهوريـــة الجزائريــــة..." />
            </div>
            <div>
              <label className="label">السطر الثاني (في الوسط)</label>
              <input className="input" value={h2} onChange={e => setH2(e.target.value)} placeholder="وزارة الداخليــــة..." />
            </div>
            <div>
              <label className="label">السطر الثالث (في الوسط)</label>
              <input className="input" value={h3} onChange={e => setH3(e.target.value)} placeholder="المديريــة العامـة..." />
            </div>
            <div>
              <label className="label">التاريخ (على اليسار، بجانب السطر الثالث)</label>
              <input className="input" value={dateText} onChange={e => setDateText(e.target.value)} placeholder="مثال: مجبـــر في: 31/05/2026" />
            </div>
            <div>
              <label className="label">السطر الرابع (في الوسط)</label>
              <input className="input" value={h4} onChange={e => setH4(e.target.value)} placeholder="مديرية الحمايــة..." />
            </div>
            <div>
              <label className="label">السطر الخامس (في الوسط)</label>
              <input className="input" value={h5} onChange={e => setH5(e.target.value)} placeholder="وحــــدة قطــاع..." />
            </div>
            <div>
              <label className="label">السطر السادس (في الوسط)</label>
              <input className="input" value={h6} onChange={e => setH6(e.target.value)} placeholder="شهيــــد الـــــــواجــــــب..." />
            </div>
            <div>
              <label className="label">رقم المرجع (على اليمين)</label>
              <input className="input" value={refText} onChange={e => setRefText(e.target.value)} placeholder="الـرقم: ..........187......./و ق ح م م/2026" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button className="btn-primary" onClick={handleSavePrint} disabled={savingPrint}>
              {savingPrint ? 'جاري الحفظ...' : <><Save size={16} /> حفظ الإعدادات</>}
            </button>
            {savedPrint && <span className="text-sm text-success-600 animate-fade-in">تم الحفظ بنجاح</span>}
          </div>

          {/* Live preview */}
          <div className="mt-5 pt-5 border-t border-neutral-100">
            <p className="text-xs text-neutral-500 mb-3">معاينة:</p>
            <div className="border border-neutral-200 rounded-xl p-5 bg-white">
              <div className="text-center space-y-1">
                {h1 && <p className="text-sm font-semibold text-neutral-800">{h1}</p>}
                {h2 && <p className="text-sm font-semibold text-neutral-800">{h2}</p>}
                <div className="relative">
                  {h3 && <p className="text-sm font-semibold text-neutral-800">{h3}</p>}
                  {dateText && <span className="absolute left-0 top-0 text-xs text-neutral-500">{dateText}</span>}
                </div>
                {h4 && <p className="text-sm font-semibold text-neutral-800">{h4}</p>}
                {h5 && <p className="text-sm font-semibold text-neutral-800">{h5}</p>}
                {h6 && <p className="text-sm font-semibold text-neutral-800">{h6}</p>}
              </div>
              {refText && <p className="text-sm font-semibold text-neutral-800 text-right mt-3">{refText}</p>}
              <div className="border-b border-neutral-400 mt-3" />
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <SettingsIcon size={20} className="text-primary-500" />
            <h3 className="font-bold text-neutral-800">معلومات النظام</h3>
          </div>
          <div className="space-y-3">
            <InfoRow label="اسم النظام" value="نظام متابعة القضايا والجلسات القضائية" />
            <InfoRow label="الإصدار" value="1.0.0" />
            <InfoRow label="قاعدة البيانات" value="Supabase" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm text-neutral-800 font-medium">{value}</span>
    </div>
  );
}
