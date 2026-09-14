import { useEffect, useState } from 'react';
import { Database, Download, Upload, FileText, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { PageLoader } from '@/components/Feedback';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Case, Person, Session, Attachment, Activity } from '@/lib/types';

export function BackupPage() {
  const { isManager } = useAuth();
  const [stats, setStats] = useState({ cases: 0, persons: 0, sessions: 0, attachments: 0, activities: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    const [c, p, s, a, act] = await Promise.all([
      supabase.from('cases').select('id', { count: 'exact', head: true }),
      supabase.from('persons').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
      supabase.from('attachments').select('id', { count: 'exact', head: true }),
      supabase.from('activities').select('id', { count: 'exact', head: true }),
    ]);
    setStats({ cases: c.count ?? 0, persons: p.count ?? 0, sessions: s.count ?? 0, attachments: a.count ?? 0, activities: act.count ?? 0 });
    setLoading(false);
  }

  async function exportJSON() {
    setExporting(true);
    const [c, p, s, a, act] = await Promise.all([
      supabase.from('cases').select('*, person:persons(*)'),
      supabase.from('persons').select('*'),
      supabase.from('sessions').select('*, case:cases(*)'),
      supabase.from('attachments').select('*'),
      supabase.from('activities').select('*'),
    ]);
    const backup = {
      exportDate: new Date().toISOString(),
      cases: c.data, persons: p.data, sessions: s.data, attachments: a.data, activities: act.data,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  async function exportCSV() {
    setExporting(true);
    const { data } = await supabase.from('cases').select('*, person:persons(*)');
    const rows: string[][] = [['رقم القضية', 'التاريخ', 'المعني', 'نوع القضية', 'المحكمة', 'الجهة القضائية', 'الحالة', 'ملاحظات']];
    (data ?? []).forEach((c: any) => {
      rows.push([c.case_number, c.date, c.person?.full_name ?? '', c.case_type, c.court, c.judicial_authority, c.status, c.notes ?? '']);
    });
    const csv = '\uFEFF' + rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cases-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  function exportPDF() {
    window.print();
  }

  if (!isManager) {
    return <div className="flex items-center justify-center py-20 text-neutral-500">هذه الصفحة متاحة للمدير فقط</div>;
  }

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="النسخ الاحتياطي" subtitle="تصدير واسترجاع بيانات النظام" />

      {/* Data Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'القضايا', value: stats.cases, color: 'primary' },
          { label: 'الأشخاص', value: stats.persons, color: 'success' },
          { label: 'الجلسات', value: stats.sessions, color: 'warning' },
          { label: 'المرفقات', value: stats.attachments, color: 'neutral' },
          { label: 'النشاطات', value: stats.activities, color: 'neutral' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-neutral-800 font-display">{s.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Download size={20} className="text-primary-500" />
            <h3 className="font-bold text-neutral-800">تصدير البيانات</h3>
          </div>
          <div className="space-y-3">
            <button onClick={exportJSON} disabled={exporting} className="w-full flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Database size={20} /></div>
              <div className="text-right flex-1">
                <p className="text-sm font-medium text-neutral-800">نسخة احتياطية كاملة (JSON)</p>
                <p className="text-xs text-neutral-500">تصدير جميع البيانات</p>
              </div>
            </button>
            <button onClick={exportCSV} disabled={exporting} className="w-full flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-success-300 hover:bg-success-50/50 transition-all duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-success-50 text-success-600 flex items-center justify-center group-hover:scale-110 transition-transform"><FileSpreadsheet size={20} /></div>
              <div className="text-right flex-1">
                <p className="text-sm font-medium text-neutral-800">تصدير Excel (CSV)</p>
                <p className="text-xs text-neutral-500">تصدير القضايا كملف جدول</p>
              </div>
            </button>
            <button onClick={exportPDF} className="w-full flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-accent-300 hover:bg-accent-50/50 transition-all duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={20} /></div>
              <div className="text-right flex-1">
                <p className="text-sm font-medium text-neutral-800">تصدير PDF</p>
                <p className="text-xs text-neutral-500">طباعة التقرير كملف PDF</p>
              </div>
            </button>
          </div>
        </div>

        {/* Restore */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Upload size={20} className="text-accent-500" />
            <h3 className="font-bold text-neutral-800">استرجاع نسخة</h3>
          </div>
          <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center">
            <RotateCcw size={32} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-600 mb-2">استرجاع نسخة احتياطية</p>
            <p className="text-xs text-neutral-400">ميزة استرجاع البيانات من ملف JSON</p>
            <input type="file" id="restore-input" className="hidden" accept=".json" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              try {
                const backup = JSON.parse(text);
                if (backup.persons) await supabase.from('persons').upsert(backup.persons);
                if (backup.cases) await supabase.from('cases').upsert(backup.cases.map((c: any) => { const { person, ...rest } = c; return rest; }));
                if (backup.sessions) await supabase.from('sessions').upsert(backup.sessions.map((s: any) => { const { case: _, ...rest } = s; return rest; }));
                if (backup.attachments) await supabase.from('attachments').upsert(backup.attachments);
                alert('تم استرجاع البيانات بنجاح');
                loadStats();
              } catch (err) { alert('فشل استرجاع البيانات: ملف غير صالح'); }
            }} />
            <label htmlFor="restore-input" className="btn-secondary mt-4 cursor-pointer inline-flex">اختر ملف</label>
          </div>
        </div>
      </div>
    </div>
  );
}
