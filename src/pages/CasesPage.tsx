import { useEffect, useState } from 'react';
import {
  Scale, Plus, Search, Pencil, Eye, Trash2, Calendar, Filter, Printer,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/Layout';
import { Modal, ConfirmModal } from '@/components/Modal';
import { PageLoader, EmptyState, ErrorState } from '@/components/Feedback';
import { PrintArea } from '@/components/PrintArea';
import { StatusBadge } from '@/components/Badge';
import { useAuth } from '@/lib/auth';
import { CASE_STATUSES, JUDICIAL_AUTHORITIES } from '@/lib/constants';
import { formatDateShort, formatDateDisplay } from '@/lib/date';
import type { Case, Person } from '@/lib/types';
import type { PageKey } from '@/components/AppLayout';

export function CasesPage({ onNavigate }: { onNavigate: (page: PageKey, id?: string) => void }) {
  const { canEdit } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courtFilter, setCourtFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Case | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Case | null>(null);

  useEffect(() => { loadCases(); }, []);

  async function loadCases() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('cases')
      .select('*, person:persons(*)')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setCases(data ?? []);

    const { data: personsData } = await supabase.from('persons').select('*').order('full_name');
    setPersons(personsData ?? []);
    setLoading(false);
  }

  const courts = [...new Set(cases.map(c => c.court).filter(Boolean))];

  const filtered = cases.filter(c => {
    if (search) {
      const s = search.toLowerCase();
      if (!c.case_number.toLowerCase().includes(s) &&
          !(c.person?.full_name ?? '').toLowerCase().includes(s) &&
          !c.court.toLowerCase().includes(s) &&
          !c.case_type.toLowerCase().includes(s)) return false;
    }
    if (statusFilter && c.status !== statusFilter) return false;
    if (courtFilter && c.court !== courtFilter) return false;
    return true;
  });

  async function handleSave(caseData: Partial<Case>) {
    if (editing) {
      await supabase.from('cases').update(caseData).eq('id', editing.id);
      await supabase.from('activities').insert({ case_id: editing.id, action: 'تعديل قضية' });
    } else {
      const { data } = await supabase.from('cases').insert(caseData).select('id').single();
      if (data) await supabase.from('activities').insert({ case_id: data.id, action: 'إضافة قضية' });
    }
    setModalOpen(false);
    setEditing(null);
    loadCases();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('cases').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadCases();
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={loadCases} />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="القضايا"
        subtitle={`${cases.length} قضية مسجلة`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-secondary no-print" onClick={() => window.print()}><Printer size={18} /> <span className="hidden sm:inline">طباعة</span></button>
            {canEdit && <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> إضافة قضية</button>}
          </div>
        }
      />

      {/* Search & Filters */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input pr-10" placeholder="بحث برقم القضية، اسم الشخص، المحكمة، نوع القضية..." />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Filter size={16} className="text-neutral-400 shrink-0" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input py-2 w-full sm:w-auto sm:min-w-[140px]">
              <option value="">كل الحالات</option>
              {CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <select value={courtFilter} onChange={e => setCourtFilter(e.target.value)} className="input py-2 w-full sm:w-auto sm:min-w-[140px]">
            <option value="">كل المحاكم</option>
            {courts.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Scale size={48} />} title="لا توجد قضايا" message="ابدأ بإضافة قضية جديدة" action={canEdit && <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> إضافة قضية</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 text-right">
                  <th className="px-4 py-3 font-medium">رقم القضية</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-4 py-3 font-medium">المعني</th>
                  <th className="px-4 py-3 font-medium">نوع القضية</th>
                  <th className="px-4 py-3 font-medium">المحكمة</th>
                  <th className="px-4 py-3 font-medium">الجهة القضائية</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium text-center no-print">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(c => (
                  <tr key={c.id} className="table-row-hover">
                    <td className="px-4 py-3 font-medium text-primary-600 cursor-pointer" onClick={() => onNavigate('case-detail', c.id)}>{c.case_number}</td>
                    <td className="px-4 py-3 text-neutral-600">{formatDateShort(c.date)}</td>
                    <td className="px-4 py-3 text-neutral-700">{c.person?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.case_type || '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.court || '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.judicial_authority}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => onNavigate('case-detail', c.id)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="عرض"><Eye size={16} /></button>
                        {canEdit && <button onClick={() => { setEditing(c); setModalOpen(true); }} className="p-1.5 rounded-lg text-neutral-400 hover:bg-accent-50 hover:text-accent-600 transition-colors" title="تعديل"><Pencil size={16} /></button>}
                        {canEdit && <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-500 transition-colors" title="حذف"><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Area */}
      <PrintArea title="قائمة القضايا">
        <table className="w-full text-sm mt-4">
          <thead>
            <tr>
              <th>رقم القضية</th>
              <th>التاريخ</th>
              <th>المعني</th>
              <th>نوع القضية</th>
              <th>المحكمة</th>
              <th>الجهة القضائية</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>{c.case_number}</td>
                <td>{formatDateDisplay(c.date)}</td>
                <td>{c.person?.full_name ?? '—'}</td>
                <td>{c.case_type || '—'}</td>
                <td>{c.court || '—'}</td>
                <td>{c.judicial_authority}</td>
                <td>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintArea>

      <CaseModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} caseData={editing} persons={persons} />

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="حذف قضية" message={`هل أنت متأكد من حذف القضية "${deleteTarget?.case_number}"؟ سيتم حذف جميع الجلسات والمرفقات المرتبطة بها.`} confirmLabel="حذف" />
    </div>
  );
}

interface CaseModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (caseData: Partial<Case>) => void;
  caseData: Case | null;
  persons: Person[];
}

function CaseModal({ open, onClose, onSave, caseData, persons }: CaseModalProps) {
  const [form, setForm] = useState({
    case_number: '', date: new Date().toISOString().slice(0, 10), person_id: '',
    case_type: '', description: '', court: '', judicial_authority: 'محكمة', status: 'سارية', notes: '',
  });

  useEffect(() => {
    if (caseData) {
      setForm({
        case_number: caseData.case_number, date: caseData.date, person_id: caseData.person_id ?? '',
        case_type: caseData.case_type, description: caseData.description ?? '', court: caseData.court,
        judicial_authority: caseData.judicial_authority, status: caseData.status, notes: caseData.notes ?? '',
      });
    } else {
      setForm({ case_number: '', date: new Date().toISOString().slice(0, 10), person_id: '', case_type: '', description: '', court: '', judicial_authority: 'محكمة', status: 'سارية', notes: '' });
    }
  }, [caseData, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      person_id: form.person_id || null,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={caseData ? 'تعديل قضية' : 'إضافة قضية'} size="lg"
      footer={<><button className="btn-secondary" onClick={onClose}>إلغاء</button><button className="btn-primary" type="submit" form="case-form">{caseData ? 'حفظ' : 'إضافة'}</button></>}
    >
      <form id="case-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">رقم القضية <span className="text-error-500">*</span></label><input className="input" value={form.case_number} onChange={e => setForm({ ...form, case_number: e.target.value })} required /></div>
          <div><label className="label">التاريخ <span className="text-error-500">*</span></label><input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
          <div>
            <label className="label">المعني بالقضية</label>
            <select className="input" value={form.person_id} onChange={e => setForm({ ...form, person_id: e.target.value })}>
              <option value="">— اختر —</option>
              {persons.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.registration_number})</option>)}
            </select>
          </div>
          <div><label className="label">نوع القضية</label><input className="input" value={form.case_type} onChange={e => setForm({ ...form, case_type: e.target.value })} /></div>
          <div><label className="label">المحكمة</label><input className="input" value={form.court} onChange={e => setForm({ ...form, court: e.target.value })} /></div>
          <div>
            <label className="label">الجهة القضائية</label>
            <select className="input" value={form.judicial_authority} onChange={e => setForm({ ...form, judicial_authority: e.target.value })}>
              {JUDICIAL_AUTHORITIES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="label">الحالة</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div><label className="label">وصف القضية</label><textarea className="input min-h-[60px] resize-y" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div><label className="label">ملاحظات</label><textarea className="input min-h-[60px] resize-y" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
      </form>
    </Modal>
  );
}

export function CaseDetailPage({ caseId, onNavigate }: { caseId: string; onNavigate: (page: PageKey, id?: string) => void }) {
  const { canEdit, session } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteSession, setDeleteSession] = useState<any>(null);
  const [deleteAttachment, setDeleteAttachment] = useState<any>(null);

  useEffect(() => { loadCase(); }, [caseId]);

  async function loadCase() {
    setLoading(true);
    const { data: caseData } = await supabase.from('cases').select('*, person:persons(*)').eq('id', caseId).maybeSingle();
    const { data: sessionsData } = await supabase.from('sessions').select('*').eq('case_id', caseId).order('date', { ascending: false });
    const { data: attachmentsData } = await supabase.from('attachments').select('*').eq('case_id', caseId).order('created_at', { ascending: false });
    const { data: activitiesData } = await supabase.from('activities').select('*, profiles:user_id(*)').eq('case_id', caseId).order('created_at', { ascending: false });
    setCaseData(caseData as Case);
    setSessions(sessionsData ?? []);
    setAttachments(attachmentsData ?? []);
    setActivities(activitiesData ?? []);
    setLoading(false);
  }

  async function logActivity(action: string) {
    await supabase.from('activities').insert({ case_id: caseId, user_id: session?.user.id, action });
  }

  async function handleSaveSession(sessionData: any) {
    await supabase.from('sessions').insert({ ...sessionData, case_id: caseId });
    await logActivity('إضافة جلسة');
    setSessionModalOpen(false);
    loadCase();
  }

  async function handleUpload(file: File, category: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('يجب تسجيل الدخول'); return; }
    const filePath = `${user.id}/${caseId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
    if (uploadError) { alert('فشل رفع الملف: ' + uploadError.message); return; }
    await supabase.from('attachments').insert({
      case_id: caseId, file_name: file.name, file_path: filePath,
      file_type: file.type, file_size: file.size, category,
    });
    await logActivity('رفع مرفق');
    setUploadModalOpen(false);
    loadCase();
  }

  async function handleDownload(attachment: any) {
    const { data } = await supabase.storage.from('attachments').createSignedUrl(attachment.file_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function handleDeleteSession() {
    if (!deleteSession) return;
    await supabase.from('sessions').delete().eq('id', deleteSession.id);
    setDeleteSession(null);
    loadCase();
  }

  async function handleDeleteAttachment() {
    if (!deleteAttachment) return;
    await supabase.storage.from('attachments').remove([deleteAttachment.file_path]);
    await supabase.from('attachments').delete().eq('id', deleteAttachment.id);
    setDeleteAttachment(null);
    loadCase();
  }

  if (loading) return <PageLoader />;
  if (!caseData) return <EmptyState icon={<Scale size={48} />} title="القضية غير موجودة" />;

  return (
    <div className="animate-fade-in">
      <PageHeader title={`القضية ${caseData.case_number}`} subtitle={caseData.person?.full_name} onBack={() => onNavigate('cases')}
        actions={<button className="btn-secondary no-print" onClick={() => window.print()}><Printer size={18} /> طباعة</button>}
      />

      {/* Case Info */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField label="رقم القضية" value={caseData.case_number} />
          <InfoField label="التاريخ" value={formatDateShort(caseData.date)} />
          <InfoField label="المعني بالقضية" value={caseData.person?.full_name ?? '—'} />
          <InfoField label="نوع القضية" value={caseData.case_type || '—'} />
          <InfoField label="المحكمة" value={caseData.court || '—'} />
          <InfoField label="الجهة القضائية" value={caseData.judicial_authority} />
          <div><span className="text-sm text-neutral-500">الحالة: </span><StatusBadge status={caseData.status} /></div>
        </div>
        {caseData.description && <div className="mt-4 pt-4 border-t border-neutral-100"><p className="text-sm text-neutral-500 mb-1">الوصف</p><p className="text-sm text-neutral-700">{caseData.description}</p></div>}
        {caseData.notes && <div className="mt-3"><p className="text-sm text-neutral-500 mb-1">ملاحظات</p><p className="text-sm text-neutral-700">{caseData.notes}</p></div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-800">الجلسات</h3>
            {canEdit && <button className="btn-secondary text-xs py-2" onClick={() => setSessionModalOpen(true)}><Plus size={14} /> إضافة جلسة</button>}
          </div>
          {sessions.length === 0 ? <EmptyState title="لا توجد جلسات" /> : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold"><Calendar size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700">{formatDateShort(s.date)} {s.time && `• ${s.time}`}</p>
                    <p className="text-xs text-neutral-500">{s.court} {s.result && `• ${s.result}`}</p>
                  </div>
                  {canEdit && <button onClick={() => setDeleteSession(s)} className="p-1 rounded text-neutral-400 hover:text-error-500"><Trash2 size={14} /></button>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-800">المرفقات</h3>
            {canEdit && <button className="btn-secondary text-xs py-2" onClick={() => setUploadModalOpen(true)}><Plus size={14} /> رفع ملف</button>}
          </div>
          {attachments.length === 0 ? <EmptyState title="لا توجد مرفقات" /> : (
            <div className="space-y-2">
              {attachments.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold">
                    {a.file_type.includes('pdf') ? 'PDF' : a.file_type.includes('image') ? 'IMG' : 'DOC'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 truncate">{a.file_name}</p>
                    <p className="text-xs text-neutral-500">{a.category}</p>
                  </div>
                  <button onClick={() => handleDownload(a)} className="p-1 rounded text-neutral-400 hover:text-primary-600" title="تحميل"><Eye size={14} /></button>
                  {canEdit && <button onClick={() => setDeleteAttachment(a)} className="p-1 rounded text-neutral-400 hover:text-error-500" title="حذف"><Trash2 size={14} /></button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="card p-5 mt-6">
        <h3 className="font-bold text-neutral-800 mb-4">سجل العمليات</h3>
        {activities.length === 0 ? <EmptyState title="لا توجد عمليات مسجلة" /> : (
          <div className="space-y-3">
            {activities.map(act => (
              <div key={act.id} className="flex items-start gap-3 py-2 border-b border-neutral-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-700">{act.action}</p>
                  <p className="text-xs text-neutral-400">{act.profiles?.full_name ?? '—'} • {new Date(act.created_at).toLocaleString('ar')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print Area */}
      <PrintArea title={`تفاصيل القضية ${caseData.case_number}`}>
        <div className="mt-4">
          <table className="w-full text-sm">
            <tbody>
              <tr><td style={{ width: '30%', fontWeight: 'bold' }}>رقم القضية</td><td>{caseData.case_number}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>التاريخ</td><td>{formatDateDisplay(caseData.date)}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>المعني بالقضية</td><td>{caseData.person?.full_name ?? '—'}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>نوع القضية</td><td>{caseData.case_type || '—'}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>المحكمة</td><td>{caseData.court || '—'}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>الجهة القضائية</td><td>{caseData.judicial_authority}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>الحالة</td><td>{caseData.status}</td></tr>
              {caseData.description && <tr><td style={{ fontWeight: 'bold' }}>الوصف</td><td>{caseData.description}</td></tr>}
              {caseData.notes && <tr><td style={{ fontWeight: 'bold' }}>ملاحظات</td><td>{caseData.notes}</td></tr>}
            </tbody>
          </table>

          {sessions.length > 0 && (
            <div className="mt-6">
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>الجلسات</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الساعة</th>
                    <th>المحكمة</th>
                    <th>القاعة</th>
                    <th>القاضي</th>
                    <th>النتيجة</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td>{formatDateDisplay(s.date)}</td>
                      <td>{s.time || '—'}</td>
                      <td>{s.court || '—'}</td>
                      <td>{s.room || '—'}</td>
                      <td>{s.judge || '—'}</td>
                      <td>{s.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PrintArea>

      <SessionModal open={sessionModalOpen} onClose={() => setSessionModalOpen(false)} onSave={handleSaveSession} court={caseData.court} />
      <UploadModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onUpload={handleUpload} />
      <ConfirmModal open={!!deleteSession} onClose={() => setDeleteSession(null)} onConfirm={handleDeleteSession} title="حذف جلسة" message="هل أنت متأكد من حذف هذه الجلسة؟" confirmLabel="حذف" />
      <ConfirmModal open={!!deleteAttachment} onClose={() => setDeleteAttachment(null)} onConfirm={handleDeleteAttachment} title="حذف مرفق" message="هل أنت متأكد من حذف هذا المرفق؟" confirmLabel="حذف" />
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return <div><span className="text-sm text-neutral-500">{label}: </span><span className="text-sm text-neutral-800 font-medium">{value}</span></div>;
}

import { SESSION_RESULTS } from '@/lib/constants';
import { formatFileSize } from '@/lib/date';

function SessionModal({ open, onClose, onSave, court }: { open: boolean; onClose: () => void; onSave: (data: any) => void; court: string }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), time: '', court: '', room: '', judge: '', result: 'تأجيل', notes: '' });
  useEffect(() => { if (open) setForm(f => ({ ...f, court })); }, [open, court]);
  return (
    <Modal open={open} onClose={onClose} title="إضافة جلسة" size="lg"
      footer={<><button className="btn-secondary" onClick={onClose}>إلغاء</button><button className="btn-primary" type="submit" form="session-form">إضافة</button></>}
    >
      <form id="session-form" onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
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

import { ATTACHMENT_CATEGORIES } from '@/lib/constants';
import { Upload } from 'lucide-react';

function UploadModal({ open, onClose, onUpload }: { open: boolean; onClose: () => void; onUpload: (file: File, category: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('أخرى');
  return (
    <Modal open={open} onClose={onClose} title="رفع ملف" size="md"
      footer={<><button className="btn-secondary" onClick={onClose}>إلغاء</button><button className="btn-primary" disabled={!file} onClick={() => file && onUpload(file, category)}>رفع</button></>}
    >
      <div className="space-y-4">
        <div>
          <label className="label">الملف</label>
          <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
            <input type="file" id="file-upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload size={24} className="text-neutral-400" />
              <span className="text-sm text-neutral-600">{file ? file.name : 'اختر ملفاً (PDF, JPG, PNG, DOCX, XLSX)'}</span>
            </label>
          </div>
        </div>
        <div>
          <label className="label">تصنيف المرفق</label>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            {ATTACHMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}
