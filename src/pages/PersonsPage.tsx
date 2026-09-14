import { useEffect, useState, useRef } from 'react';
import {
  Users, Plus, Search, Pencil, Eye, Trash2, Printer, Phone, Mail, MapPin, Upload, FileSpreadsheet, Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/Layout';
import { Modal, ConfirmModal } from '@/components/Modal';
import { PageLoader, EmptyState, ErrorState } from '@/components/Feedback';
import { PrintArea } from '@/components/PrintArea';
import { useAuth } from '@/lib/auth';
import { getPrintSettings } from '@/lib/settings';
import type { Person } from '@/lib/types';
import type { PageKey } from '@/components/AppLayout';

export function PersonsPage({ onNavigate }: { onNavigate: (page: PageKey, id?: string) => void }) {
  const { canEdit } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPersons(); }, []);

  async function loadPersons() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('persons').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setPersons(data ?? []);
    setLoading(false);
  }

  const filtered = persons.filter(p =>
    !search ||
    p.full_name.includes(search) ||
    p.registration_number.includes(search) ||
    p.rank.includes(search) ||
    p.unit.includes(search)
  );

  async function handleSave(person: Partial<Person>) {
    if (editing) {
      await supabase.from('persons').update(person).eq('id', editing.id);
    } else {
      await supabase.from('persons').insert(person);
    }
    setModalOpen(false);
    setEditing(null);
    loadPersons();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('persons').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadPersons();
  }

  function handlePrint() {
    window.print();
  }

  function handleExcelUpload(file: File) {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
        if (rows.length === 0) {
          setImportError('الملف فارغ أو لا يحتوي على بيانات');
          return;
        }
        const mapped = rows.map((row) => ({
          registration_number: String(row['رقم القيد'] ?? row['registration_number'] ?? row['رقم'] ?? '').trim(),
          full_name: String(row['الاسم'] ?? row['full_name'] ?? row['الاسم الكامل'] ?? '').trim(),
          rank: String(row['الرتبة'] ?? row['rank'] ?? '').trim(),
          unit: String(row['الوحدة'] ?? row['unit'] ?? '').trim(),
          phone: String(row['الهاتف'] ?? row['phone'] ?? '').trim(),
          email: String(row['البريد'] ?? row['email'] ?? '').trim(),
          address: String(row['العنوان'] ?? row['address'] ?? '').trim(),
          notes: String(row['ملاحظات'] ?? row['notes'] ?? '').trim(),
        })).filter(r => r.registration_number && r.full_name);
        if (mapped.length === 0) {
          setImportError('لم يتم العثور على بيانات صالحة. تأكد من وجود أعمدة "رقم القيد" و "الاسم"');
          return;
        }
        setImportData(mapped);
      } catch {
        setImportError('فشل في قراءة الملف. تأكد من أنه ملف Excel صالح (.xlsx)');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    setImporting(true);
    const { error } = await supabase.from('persons').insert(importData);
    setImporting(false);
    if (error) {
      setImportError('فشل في إضافة البيانات: ' + error.message);
      return;
    }
    setImportModalOpen(false);
    setImportData([]);
    loadPersons();
  }

  function downloadTemplate() {
    const template = [
      { 'رقم القيد': '1234', 'الاسم': 'مثال: أحمد محمد', 'الرتبة': 'رتبة', 'الوحدة': 'وحدة', 'الهاتف': '0555555555', 'البريد': '', 'العنوان': '', 'ملاحظات': '' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المعنيون');
    XLSX.writeFile(wb, 'نموذج_استيراد_المعنيين.xlsx');
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={loadPersons} />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="المعنيون بالقضايا"
        subtitle={`${persons.length} شخص مسجل`}
        actions={
          canEdit && (
            <div className="flex items-center gap-2 flex-wrap">
              <button className="btn-secondary" onClick={() => setImportModalOpen(true)}>
                <FileSpreadsheet size={18} />
                <span className="hidden sm:inline">استيراد Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
              <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
                <Plus size={18} />
                إضافة
              </button>
            </div>
          )
        }
      />

      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pr-10"
              placeholder="بحث بالاسم، رقم القيد، الرتبة، الوحدة..."
            />
          </div>
          <button className="btn-secondary no-print" onClick={handlePrint} title="طباعة">
            <Printer size={18} />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="لا يوجد أشخاص مسجلون"
            message="ابدأ بإضافة الأشخاص المعنيين بالقضايا أو استيرادهم من ملف Excel"
            action={canEdit && (
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => setImportModalOpen(true)}><FileSpreadsheet size={18} /> استيراد Excel</button>
                <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> إضافة شخص</button>
              </div>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 text-right">
                  <th className="px-4 py-3 font-medium">رقم القيد</th>
                  <th className="px-4 py-3 font-medium">الاسم</th>
                  <th className="px-4 py-3 font-medium">الرتبة</th>
                  <th className="px-4 py-3 font-medium">الوحدة</th>
                  <th className="px-4 py-3 font-medium">الهاتف</th>
                  <th className="px-4 py-3 font-medium text-center no-print">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(person => (
                  <tr key={person.id} className="table-row-hover">
                    <td className="px-4 py-3 font-medium text-neutral-700">{person.registration_number}</td>
                    <td className="px-4 py-3 text-neutral-800">{person.full_name}</td>
                    <td className="px-4 py-3 text-neutral-600">{person.rank || '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{person.unit || '—'}</td>
                    <td className="px-4 py-3 text-neutral-600" dir="ltr">{person.phone || '—'}</td>
                    <td className="px-4 py-3 no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => onNavigate('person-detail', person.id)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="عرض">
                          <Eye size={16} />
                        </button>
                        {canEdit && (
                          <button onClick={() => { setEditing(person); setModalOpen(true); }} className="p-1.5 rounded-lg text-neutral-400 hover:bg-accent-50 hover:text-accent-600 transition-colors" title="تعديل">
                            <Pencil size={16} />
                          </button>
                        )}
                        <button onClick={handlePrint} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors" title="طباعة">
                          <Printer size={16} />
                        </button>
                        {canEdit && (
                          <button onClick={() => setDeleteTarget(person)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-500 transition-colors" title="حذف">
                            <Trash2 size={16} />
                          </button>
                        )}
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
      <PrintArea title="قائمة المعنيين بالقضايا">
        <table className="w-full text-sm mt-4">
          <thead>
            <tr>
              <th>رقم القيد</th>
              <th>الاسم</th>
              <th>الرتبة</th>
              <th>الوحدة</th>
              <th>الهاتف</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(person => (
              <tr key={person.id}>
                <td>{person.registration_number}</td>
                <td>{person.full_name}</td>
                <td>{person.rank || '—'}</td>
                <td>{person.unit || '—'}</td>
                <td dir="ltr">{person.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintArea>

      <PersonModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        person={editing}
      />

      {/* Import Modal */}
      <Modal
        open={importModalOpen}
        onClose={() => { setImportModalOpen(false); setImportData([]); setImportError(null); }}
        title="استيراد المعنيين من Excel"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={downloadTemplate}>
              <Download size={16} /> تحميل نموذج
            </button>
            <button className="btn-secondary" onClick={() => { setImportModalOpen(false); setImportData([]); setImportError(null); }}>إلغاء</button>
            {importData.length > 0 && (
              <button className="btn-primary" onClick={handleImport} disabled={importing}>
                {importing ? 'جاري الاستيراد...' : `استيراد ${importData.length} شخص`}
              </button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {importError && (
            <div className="px-4 py-3 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm">
              {importError}
            </div>
          )}
          {importData.length === 0 ? (
            <>
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={e => { if (e.target.files?.[0]) handleExcelUpload(e.target.files[0]); }}
                />
                <label htmlFor={fileInputRef.current?.id ?? ''} className="cursor-pointer flex flex-col items-center gap-3" onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet size={32} className="text-neutral-400" />
                  <span className="text-sm text-neutral-600">اختر ملف Excel (.xlsx)</span>
                  <span className="text-xs text-neutral-400">يجب أن يحتوي على أعمدة: رقم القيد، الاسم</span>
                </label>
              </div>
              <div className="text-xs text-neutral-500 bg-neutral-50 rounded-xl p-3">
                <p className="font-medium mb-1">الأعمدة المتوافقة:</p>
                <p>رقم القيد، الاسم، الرتبة، الوحدة، الهاتف، البريد، العنوان، ملاحظات</p>
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm text-neutral-600 mb-3">سيتم استيراد {importData.length} شخص:</p>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-neutral-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 sticky top-0">
                    <tr className="text-right">
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">رقم القيد</th>
                      <th className="px-3 py-2 font-medium">الاسم</th>
                      <th className="px-3 py-2 font-medium">الرتبة</th>
                      <th className="px-3 py-2 font-medium">الوحدة</th>
                      <th className="px-3 py-2 font-medium">الهاتف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {importData.map((row, i) => (
                      <tr key={i} className="text-right">
                        <td className="px-3 py-2 text-neutral-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-neutral-700">{row.registration_number}</td>
                        <td className="px-3 py-2 text-neutral-800">{row.full_name}</td>
                        <td className="px-3 py-2 text-neutral-600">{row.rank || '—'}</td>
                        <td className="px-3 py-2 text-neutral-600">{row.unit || '—'}</td>
                        <td className="px-3 py-2 text-neutral-600" dir="ltr">{row.phone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف شخص"
        message={`هل أنت متأكد من حذف "${deleteTarget?.full_name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
      />
    </div>
  );
}

interface PersonModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (person: Partial<Person>) => void;
  person: Person | null;
}

function PersonModal({ open, onClose, onSave, person }: PersonModalProps) {
  const [form, setForm] = useState({
    registration_number: '',
    full_name: '',
    rank: '',
    unit: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (person) {
      setForm({
        registration_number: person.registration_number,
        full_name: person.full_name,
        rank: person.rank,
        unit: person.unit,
        phone: person.phone,
        email: person.email ?? '',
        address: person.address ?? '',
        notes: person.notes ?? '',
      });
    } else {
      setForm({ registration_number: '', full_name: '', rank: '', unit: '', phone: '', email: '', address: '', notes: '' });
    }
  }, [person, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={person ? 'تعديل شخص' : 'إضافة شخص جديد'}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>إلغاء</button>
          <button className="btn-primary" form="person-form" type="submit">{person ? 'حفظ التعديلات' : 'إضافة'}</button>
        </>
      }
    >
      <form id="person-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">رقم القيد <span className="text-error-500">*</span></label>
            <input className="input" value={form.registration_number} onChange={e => setForm({ ...form, registration_number: e.target.value })} required />
          </div>
          <div>
            <label className="label">الاسم الكامل <span className="text-error-500">*</span></label>
            <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">الرتبة</label>
            <input className="input" value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })} />
          </div>
          <div>
            <label className="label">الوحدة</label>
            <input className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="label">رقم الهاتف</label>
            <input className="input" dir="ltr" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">البريد الإلكتروني (اختياري)</label>
            <input className="input" dir="ltr" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">العنوان (اختياري)</label>
          <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="label">الملاحظات</label>
          <textarea className="input min-h-[80px] resize-y" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
}

export function PersonDetailPage({ personId, onNavigate }: { personId: string; onNavigate: (page: PageKey, id?: string) => void }) {
  const [person, setPerson] = useState<Person | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState({ cases: 0, sessions: 0, attachments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPerson(); }, [personId]);

  async function loadPerson() {
    setLoading(true);
    const { data: personData } = await supabase.from('persons').select('*').eq('id', personId).maybeSingle();
    const { data: casesData } = await supabase.from('cases').select('*').eq('person_id', personId).order('created_at', { ascending: false });
    const caseIds = (casesData ?? []).map(c => c.id);
    let sessionCount = 0;
    let attachmentCount = 0;
    if (caseIds.length > 0) {
      const { count: sCount } = await supabase.from('sessions').select('id', { count: 'exact', head: true }).in('case_id', caseIds);
      const { count: aCount } = await supabase.from('attachments').select('id', { count: 'exact', head: true }).in('case_id', caseIds);
      sessionCount = sCount ?? 0;
      attachmentCount = aCount ?? 0;
    }
    setPerson(personData as Person);
    setCases(casesData ?? []);
    setStats({ cases: casesData?.length ?? 0, sessions: sessionCount, attachments: attachmentCount });
    setLoading(false);
  }

  if (loading) return <PageLoader />;
  if (!person) return <EmptyState icon={<Users size={48} />} title="الشخص غير موجود" />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="بطاقة المعني بالقضية" onBack={() => onNavigate('persons')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
              {person.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-800">{person.full_name}</h2>
              <p className="text-sm text-neutral-500">{person.registration_number}</p>
            </div>
          </div>
          <div className="space-y-3">
            <InfoRow icon={<Users size={16} />} label="رقم القيد" value={person.registration_number} />
            <InfoRow icon={<Users size={16} />} label="الرتبة" value={person.rank} />
            <InfoRow icon={<Users size={16} />} label="الوحدة" value={person.unit} />
            <InfoRow icon={<Phone size={16} />} label="الهاتف" value={person.phone} dir="ltr" />
            {person.email && <InfoRow icon={<Mail size={16} />} label="البريد الإلكتروني" value={person.email} dir="ltr" />}
            {person.address && <InfoRow icon={<MapPin size={16} />} label="العنوان" value={person.address} />}
          </div>
          {person.notes && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 mb-1">الملاحظات</p>
              <p className="text-sm text-neutral-700">{person.notes}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'عدد القضايا', value: stats.cases, color: 'primary' },
              { label: 'عدد الجلسات', value: stats.sessions, color: 'warning' },
              { label: 'عدد المرفقات', value: stats.attachments, color: 'neutral' },
              { label: 'الأحكام', value: cases.filter(c => c.status === 'منجزة').length, color: 'success' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className="text-2xl font-bold text-neutral-800 font-display">{s.value}</p>
                <p className="text-xs text-neutral-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-neutral-800 mb-4">القضايا المرتبطة</h3>
            {cases.length === 0 ? (
              <EmptyState title="لا توجد قضايا مرتبطة" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-600 text-right">
                      <th className="px-3 py-2 font-medium">رقم القضية</th>
                      <th className="px-3 py-2 font-medium">النوع</th>
                      <th className="px-3 py-2 font-medium">المحكمة</th>
                      <th className="px-3 py-2 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {cases.map(c => (
                      <tr key={c.id} className="table-row-hover cursor-pointer" onClick={() => onNavigate('case-detail', c.id)}>
                        <td className="px-3 py-2.5 font-medium text-primary-600">{c.case_number}</td>
                        <td className="px-3 py-2.5 text-neutral-600">{c.case_type || '—'}</td>
                        <td className="px-3 py-2.5 text-neutral-600">{c.court || '—'}</td>
                        <td className="px-3 py-2.5"><StatusBadgeMini status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, dir }: { icon: React.ReactNode; label: string; value: string; dir?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-neutral-400">{icon}</span>
      <span className="text-sm text-neutral-500 w-24">{label}</span>
      <span className="text-sm text-neutral-800 font-medium flex-1" dir={dir}>{value || '—'}</span>
    </div>
  );
}

function StatusBadgeMini({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'سارية': 'bg-primary-50 text-primary-700',
    'مؤجلة': 'bg-accent-50 text-accent-700',
    'منجزة': 'bg-success-50 text-success-700',
    'ملغاة': 'bg-error-50 text-error-700',
    'استئناف': 'bg-purple-50 text-purple-700',
    'طعن': 'bg-orange-50 text-orange-700',
  };
  return <span className={`badge ${colors[status] ?? 'bg-neutral-100 text-neutral-600'}`}>{status}</span>;
}
