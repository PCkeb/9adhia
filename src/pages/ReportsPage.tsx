import { useEffect, useState } from 'react';
import { FileText, Users, Scale, CalendarDays, CheckCircle2, Download, Printer } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { PageLoader, EmptyState } from '@/components/Feedback';
import { StatusBadge } from '@/components/Badge';
import { supabase } from '@/lib/supabase';
import { CASE_STATUSES, JUDICIAL_AUTHORITIES } from '@/lib/constants';
import { formatDateShort, isToday, isThisWeek, ARABIC_MONTHS } from '@/lib/date';
import type { Case, Person, Session } from '@/lib/types';

type ReportType = 'person' | 'cases' | 'sessions' | 'achievement';

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('cases');
  const [persons, setPersons] = useState<Person[]>([]);
  const [cases, setCases] = useState<(Case & { person?: Person | null })[]>([]);
  const [sessions, setSessions] = useState<(Session & { case?: Case | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ personId: '', court: '', year: '', month: '', status: '', sessionPeriod: 'all' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [personsRes, casesRes, sessionsRes] = await Promise.all([
      supabase.from('persons').select('*').order('full_name'),
      supabase.from('cases').select('*, person:persons(*)').order('created_at', { ascending: false }),
      supabase.from('sessions').select('*, case:cases(*)').order('date', { ascending: false }),
    ]);
    setPersons(personsRes.data ?? []);
    setCases(casesRes.data ?? []);
    setSessions(sessionsRes.data ?? []);
    setLoading(false);
  }

  const courts = [...new Set(cases.map(c => c.court).filter(Boolean))];
  const years = [...new Set(cases.map(c => new Date(c.date).getFullYear()))].sort((a, b) => b - a);

  let reportCases = cases;
  let reportSessions = sessions;

  if (reportType === 'person' && filters.personId) {
    reportCases = cases.filter(c => c.person_id === filters.personId);
    const caseIds = reportCases.map(c => c.id);
    reportSessions = sessions.filter(s => caseIds.includes(s.case_id));
  }
  if (reportType === 'cases' || reportType === 'achievement') {
    if (filters.court) reportCases = reportCases.filter(c => c.court === filters.court);
    if (filters.year) reportCases = reportCases.filter(c => new Date(c.date).getFullYear() === Number(filters.year));
    if (filters.month) reportCases = reportCases.filter(c => new Date(c.date).getMonth() + 1 === Number(filters.month));
    if (filters.status) reportCases = reportCases.filter(c => c.status === filters.status);
  }
  if (reportType === 'achievement') {
    reportCases = reportCases.filter(c => ['منجزة', 'سارية', 'ملغاة'].includes(c.status));
  }
  if (reportType === 'sessions') {
    if (filters.sessionPeriod === 'today') reportSessions = sessions.filter(s => isToday(s.date));
    if (filters.sessionPeriod === 'week') reportSessions = sessions.filter(s => isThisWeek(s.date));
    if (filters.sessionPeriod === 'month') {
      const now = new Date();
      reportSessions = sessions.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
  }

  function handlePrint() { window.print(); }

  function handleExportCSV() {
    let rows: string[][] = [];
    if (reportType === 'sessions') {
      rows = [['التاريخ', 'الساعة', 'رقم القضية', 'المحكمة', 'النتيجة']];
      reportSessions.forEach(s => rows.push([s.date, s.time, s.case?.case_number ?? '', s.court, s.result]));
    } else {
      rows = [['رقم القضية', 'التاريخ', 'المعني', 'النوع', 'المحكمة', 'الجهة', 'الحالة']];
      reportCases.forEach(c => rows.push([c.case_number, c.date, c.person?.full_name ?? '', c.case_type, c.court, c.judicial_authority, c.status]));
    }
    const csv = '\uFEFF' + rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <PageLoader />;

  const reportTabs = [
    { key: 'cases' as const, label: 'تقرير القضايا', icon: <Scale size={18} /> },
    { key: 'person' as const, label: 'تقرير شخص', icon: <Users size={18} /> },
    { key: 'sessions' as const, label: 'تقرير الجلسات', icon: <CalendarDays size={18} /> },
    { key: 'achievement' as const, label: 'تقرير الإنجاز', icon: <CheckCircle2 size={18} /> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="التقارير" subtitle="إنشاء وعرض التقارير الإحصائية"
        actions={<><button className="btn-secondary" onClick={handleExportCSV}><Download size={16} /> Excel</button><button className="btn-secondary" onClick={handlePrint}><Printer size={16} /> طباعة</button></>}
      />

      <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto">
        {reportTabs.map(tab => (
          <button key={tab.key} onClick={() => setReportType(tab.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${reportType === tab.key ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-stretch sm:items-end">
          {reportType === 'person' && (
            <div className="flex-1 min-w-[200px]">
              <label className="label">اختر الشخص</label>
              <select className="input" value={filters.personId} onChange={e => setFilters({ ...filters, personId: e.target.value })}>
                <option value="">— اختر —</option>
                {persons.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
          )}
          {reportType === 'cases' && (
            <>
              <div><label className="label">المحكمة</label><select className="input py-2 w-auto" value={filters.court} onChange={e => setFilters({ ...filters, court: e.target.value })}><option value="">الكل</option>{courts.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="label">السنة</label><select className="input py-2 w-auto" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}><option value="">الكل</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><label className="label">الشهر</label><select className="input py-2 w-auto" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}><option value="">الكل</option>{ARABIC_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select></div>
              <div><label className="label">الحالة</label><select className="input py-2 w-auto" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">الكل</option>{CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </>
          )}
          {reportType === 'achievement' && (
            <div><label className="label">الحالة</label><select className="input py-2 w-auto" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">الكل</option><option value="منجزة">منجزة</option><option value="سارية">سارية</option><option value="ملغاة">ملغاة</option></select></div>
          )}
          {reportType === 'sessions' && (
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'الكل' }, { key: 'today', label: 'اليوم' }, { key: 'week', label: 'الأسبوع' }, { key: 'month', label: 'الشهر' },
              ].map(p => (
                <button key={p.key} onClick={() => setFilters({ ...filters, sessionPeriod: p.key })} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filters.sessionPeriod === p.key ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 border border-neutral-300'}`}>{p.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="card overflow-hidden">
        {reportType === 'sessions' ? (
          reportSessions.length === 0 ? <EmptyState icon={<CalendarDays size={48} />} title="لا توجد جلسات" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-neutral-50 text-neutral-600 text-right"><th className="px-4 py-3 font-medium">التاريخ</th><th className="px-4 py-3 font-medium">الساعة</th><th className="px-4 py-3 font-medium">رقم القضية</th><th className="px-4 py-3 font-medium">المحكمة</th><th className="px-4 py-3 font-medium">النتيجة</th></tr></thead>
                <tbody className="divide-y divide-neutral-100">
                  {reportSessions.map(s => (<tr key={s.id} className="table-row-hover"><td className="px-4 py-3 text-neutral-700">{formatDateShort(s.date)}</td><td className="px-4 py-3 text-neutral-600" dir="ltr">{s.time || '—'}</td><td className="px-4 py-3 text-primary-600 font-medium">{s.case?.case_number ?? '—'}</td><td className="px-4 py-3 text-neutral-600">{s.court || '—'}</td><td className="px-4 py-3 text-neutral-600">{s.result}</td></tr>))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          reportCases.length === 0 ? <EmptyState icon={<FileText size={48} />} title="لا توجد قضايا" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-neutral-50 text-neutral-600 text-right"><th className="px-4 py-3 font-medium">رقم القضية</th><th className="px-4 py-3 font-medium">التاريخ</th><th className="px-4 py-3 font-medium">المعني</th><th className="px-4 py-3 font-medium">المحكمة</th><th className="px-4 py-3 font-medium">الحالة</th></tr></thead>
                <tbody className="divide-y divide-neutral-100">
                  {reportCases.map(c => (<tr key={c.id} className="table-row-hover"><td className="px-4 py-3 font-medium text-primary-600">{c.case_number}</td><td className="px-4 py-3 text-neutral-600">{formatDateShort(c.date)}</td><td className="px-4 py-3 text-neutral-700">{c.person?.full_name ?? '—'}</td><td className="px-4 py-3 text-neutral-600">{c.court || '—'}</td><td className="px-4 py-3"><StatusBadge status={c.status} /></td></tr>))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-neutral-800">{reportCases.length}</p><p className="text-xs text-neutral-500 mt-1">قضية</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-neutral-800">{reportSessions.length}</p><p className="text-xs text-neutral-500 mt-1">جلسة</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-neutral-800">{reportCases.filter(c => c.status === 'منجزة').length}</p><p className="text-xs text-neutral-500 mt-1">منجزة</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-neutral-800">{reportCases.filter(c => c.status === 'سارية').length}</p><p className="text-xs text-neutral-500 mt-1">سارية</p></div>
      </div>
    </div>
  );
}
