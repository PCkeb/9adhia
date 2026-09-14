import { useEffect, useState } from 'react';
import { FolderOpen, Download, Eye, Trash2, Upload, Search } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { PageLoader, EmptyState } from '@/components/Feedback';
import { Modal, ConfirmModal } from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import { ATTACHMENT_CATEGORIES } from '@/lib/constants';
import { formatFileSize, formatDate } from '@/lib/date';
import { useAuth } from '@/lib/auth';
import type { Attachment, Case } from '@/lib/types';
import type { PageKey } from '@/components/AppLayout';

export function AttachmentsPage({ onNavigate }: { onNavigate: (page: PageKey, id?: string) => void }) {
  const { canEdit } = useAuth();
  const [attachments, setAttachments] = useState<(Attachment & { case?: Case | null })[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);

  useEffect(() => { loadAttachments(); }, []);

  async function loadAttachments() {
    setLoading(true);
    const { data } = await supabase.from('attachments').select('*, case:cases(*)').order('created_at', { ascending: false });
    setAttachments(data ?? []);
    const { data: casesData } = await supabase.from('cases').select('*').order('case_number');
    setCases(casesData ?? []);
    setLoading(false);
  }

  const filtered = attachments.filter(a => {
    if (search) {
      const s = search.toLowerCase();
      if (!a.file_name.toLowerCase().includes(s) && !(a.case?.case_number ?? '').toLowerCase().includes(s)) return false;
    }
    if (categoryFilter && a.category !== categoryFilter) return false;
    return true;
  });

  async function handleUpload(file: File, category: string, caseId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('يجب تسجيل الدخول'); return; }
    const filePath = `${user.id}/${caseId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
    if (uploadError) { alert('فشل رفع الملف: ' + uploadError.message); return; }
    await supabase.from('attachments').insert({ case_id: caseId, file_name: file.name, file_path: filePath, file_type: file.type, file_size: file.size, category });
    await supabase.from('activities').insert({ case_id: caseId, action: 'رفع مرفق' });
    setUploadModalOpen(false);
    loadAttachments();
  }

  async function handleDownload(a: Attachment) {
    const { data } = await supabase.storage.from('attachments').createSignedUrl(a.file_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.storage.from('attachments').remove([deleteTarget.file_path]);
    await supabase.from('attachments').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadAttachments();
  }

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="المرفقات" subtitle={`${attachments.length} مرفق`}
        actions={canEdit && <button className="btn-primary" onClick={() => setUploadModalOpen(true)}><Upload size={18} /> رفع ملف</button>}
      />

      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1 min-w-0 relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input pr-10" placeholder="بحث باسم الملف أو رقم القضية..." />
        </div>
        <div>
          <select className="input py-2 w-full sm:w-auto sm:min-w-[140px]" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">كل التصنيفات</option>
            {ATTACHMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<FolderOpen size={48} />} title="لا توجد مرفقات" message="ارفع ملفات PDF, صور، مستندات..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 text-right">
                  <th className="px-4 py-3 font-medium">اسم الملف</th>
                  <th className="px-4 py-3 font-medium">القضية</th>
                  <th className="px-4 py-3 font-medium">التصنيف</th>
                  <th className="px-4 py-3 font-medium">الحجم</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-4 py-3 font-medium text-center">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(a => (
                  <tr key={a.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {a.file_type.includes('pdf') ? 'PDF' : a.file_type.includes('image') ? 'IMG' : 'DOC'}
                        </div>
                        <span className="text-neutral-700 font-medium truncate max-w-[200px]">{a.file_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-primary-600 font-medium cursor-pointer" onClick={() => a.case_id && onNavigate('case-detail', a.case_id)}>{a.case?.case_number ?? '—'}</td>
                    <td className="px-4 py-3"><span className="badge bg-neutral-100 text-neutral-600">{a.category}</span></td>
                    <td className="px-4 py-3 text-neutral-500">{formatFileSize(a.file_size)}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleDownload(a)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="تحميل/معاينة"><Eye size={16} /></button>
                        <button onClick={() => handleDownload(a)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors" title="تحميل"><Download size={16} /></button>
                        {canEdit && <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-500 transition-colors" title="حذف"><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadAttachmentModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onUpload={handleUpload} cases={cases} />
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="حذف مرفق" message={`هل أنت متأكد من حذف "${deleteTarget?.file_name}"؟`} confirmLabel="حذف" />
    </div>
  );
}

function UploadAttachmentModal({ open, onClose, onUpload, cases }: { open: boolean; onClose: () => void; onUpload: (file: File, category: string, caseId: string) => void; cases: Case[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('أخرى');
  const [caseId, setCaseId] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="رفع ملف" size="md"
      footer={<><button className="btn-secondary" onClick={onClose}>إلغاء</button><button className="btn-primary" disabled={!file || !caseId} onClick={() => file && caseId && onUpload(file, category, caseId)}>رفع</button></>}
    >
      <div className="space-y-4">
        <div>
          <label className="label">القضية <span className="text-error-500">*</span></label>
          <select className="input" value={caseId} onChange={e => setCaseId(e.target.value)} required>
            <option value="">— اختر —</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.case_number}</option>)}
          </select>
        </div>
        <div>
          <label className="label">الملف</label>
          <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
            <input type="file" id="attach-upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <label htmlFor="attach-upload" className="cursor-pointer flex flex-col items-center gap-2">
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
