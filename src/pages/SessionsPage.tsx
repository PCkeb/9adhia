import { useEffect, useState } from 'react';
import { CalendarDays, Plus, Trash2, Clock, MapPin, Search, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/Layout';
import { Modal, ConfirmModal } from '@/components/Modal';
import { PageLoader, EmptyState, ErrorState } from '@/components/Feedback';
import { PrintArea } from '@/components/PrintArea';
import { useAuth } from '@/lib/auth';
import { SESSION_RESULTS, SESSION_RESULT_COLORS } from '@/lib/constants';
import { formatDateShort, formatDateDisplay, getDaysUntil, isToday, isThisWeek } from '@/lib/date';
import type { Session, Case } from '@/lib/types';
import type { PageKey } from '@/components/AppLayout';

export function SessionsPage({ onNavigate }: { onNavigate: (page: PageKey, id?: string) => void }) {
  const { canEdit } = useAuth();
  const [sessions, setSessions] = useState<(Session & { case?: Case | null })[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('sessions').select('*, case:cases(*)').order('date', { ascending: true });
    if (error) setError(error.message);
    else setSessions(data ?? []);
    const { data: casesData } = await supabase.from('cases').select('*').order('case_number');
    setCases(casesData ?? []);
    setLoading(false);
  }

  let filtered = sessions;
  if (filter === 'today') filtered = filtered.filter(s => isToday(s.date));
  if (filter === 'week') filtered = filtered.filter(s => isThisWeek(s.date));
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(sess =>
      (sess.case?.case_number ?? '').toLowerCase().includes(s) ||
      sess.court.toLowerCase().includes(s) ||
      sess.result.toLowerCase().includes(s)
    );
  }

  async function handleSave(sessionData: any) {
    await supabase.from('sessions').insert(sessionData);
    if (sessionData.case_id) {
      await supabase.from('activities').insert({ case_id: sessionData.case_id, action: 'إضافة جلسة' });
    }
    setModalOpen(false);
    loadSessions();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('sessions').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadSessions();
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={loadSessions} />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="الجلسات" subtitle={`${sessions.length} جلسة`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-secondary no-print" onClick={() => window.print()}><Printer size={18} /> <span className="hidden sm:inline">طباعة</span></button>
            {canEdit && <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={18} /> إضافة جلسة</button>}
          </div>
        }
      />

      <div className="card p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input pr-10" placeholder="بحث برقم القضية، المحكمة، النتيجة..." />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: 'الكل' },
            { key: 'today' as const, label: 'اليوم' },
            { key: 'week' as const, label: 'هذا الأسبوع' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f.key ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50'}`}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<CalendarDays size={48} />} title="لا توجد جلسات" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 text-right">
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-4 py-3 font-medium">الساعة</th>
                  <th className="px-4 py-3 font-medium">رقم القضية</th>
                  <th className="px-4 py-3 font-medium">المحكمة</th>
                  <th className="px-4 py-3 font-medium">القاعة</th>
                  <th className="px-4 py-3 font-medium">النتيجة</th>
                  {canEdit && <th className="px-4 py-3 font-medium text-center no-print">العمليات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(s => {
                  const days = getDaysUntil(s.date);
                  const isUpcoming = days >= 0;
                  return (
                    <tr key={s.id} className="table-row-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-700 font-medium">{formatDateShort(s.date)}</span>
                          {isToday(s.date) && <span className="badge bg-accent-50 text-accent-700">اليوم</span>}
                          {isUpcoming && !isToday(s.date) && days <= 7 && <span className="badge bg-primary-50 text-primary-700">قريباً</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600" dir="ltr">{s.time || '—'}</td>
                      <td className="px-4 py-3 text-primary-600 font-medium cursor-pointer" onClick={() => s.case_id && onNavigate('case-detail', s.case_id)}>{s.case?.case_number ?? '—'}</td>
                      <td className="px-4 py-3 text-neutral-600">{s.court || '—'}</td>
                      <td className="px-4 py-3 text-neutral-600">{s.room || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${SESSION_RESULT_COLORS[s.result]?.bg ?? 'bg-neutral-100'} ${SESSION_RESULT_COLORS[s.result]?.text ?? 'text-neutral-600'}`}>{s.result}</span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 no-print">
                          <div className="flex items-center justify-center">
                            <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Area */}
      <PrintArea title="قائمة الجلسات">
        <table className="w-full text-sm mt-4">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الساعة</th>
              <th>رقم القضية</th>
              <th>المحكمة</th>
              <th>القاعة</th>
              <th>النتيجة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td>{formatDateDisplay(s.date)}</td>
                <td>{s.time || '—'}</td>
                <td>{s.case?.case_number ?? '—'}</td>
                <td>{s.court || '—'}</td>
                <td>{s.room || '—'}</td>
                <td>{s.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintArea>

      <AddSessionModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} cases={cases} />
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="حذف جلسة" message="هل أنت متأكد من حذف هذه الجلسة؟" confirmLabel="حذف" />
    </div>
  );
}

function AddSessionModal({ open, onClose, onSave, cases }: { open: boolean; onClose: () => void; onSave: (data: any) => void; cases: Case[] }) {
  const [form, setForm] = useState({ case_id: '', date: new Date().toISOString().slice(0, 10), time: '', court: '', room: '', judge: '', result: 'تأجيل', notes: '' });
  return (
    <Modal open={open} onClose={onClose} title="إضافة جلسة" size="lg"
      footer={<><button className="btn-secondary" onClick={onClose}>إلغاء</button><button className="btn-primary" type="submit" form="session-add-form">إضافة</button></>}
    >
      <form id="session-add-form" onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
        <div>
          <label className="label">القضية <span className="text-error-500">*</span></label>
          <select className="input" value={form.case_id} onChange={e => setForm({ ...form, case_id: e.target.value })} required>
            <option value="">— اختر —</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.case_number}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">تاريخ الجلسة <span className="text-error-500">*</span></label><input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
          <div><label className="label">الساعة</label><input type="time" className="input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
          <div><label className="label">المحكمة</label><input className="input" value={form.court} onChange={e => setForm({ ...form, court: e.target.value })} /></div>
          <div><label className="label">القاعة</label><input className="input" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></div>
          <div><label className="label">القاضي (اختياري)</label><input className="input" value={form.judge} onChange={e => setForm({ ...form, judge: e.target.value })} /></div>
          <div>
            <label className="label">النتيجة</label>
            <select className="input" value={form.result} onChange={e => setForm({ ...form, result: e.target.value })}>
              {SESSION_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div><label className="label">ملاحظات</label><textarea className="input min-h-[60px] resize-y" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
      </form>
    </Modal>
  );
}
