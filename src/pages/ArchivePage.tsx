import { useEffect, useState } from 'react';
import { Archive, Eye } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { PageLoader, EmptyState } from '@/components/Feedback';
import { StatusBadge } from '@/components/Badge';
import { supabase } from '@/lib/supabase';
import { formatDateShort } from '@/lib/date';
import type { Case, Person } from '@/lib/types';
import type { PageKey } from '@/components/AppLayout';

export function ArchivePage({ onNavigate }: { onNavigate: (page: PageKey, id?: string) => void }) {
  const [cases, setCases] = useState<(Case & { person?: Person | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'منجزة' | 'ملغاة'>('all');

  useEffect(() => { loadCases(); }, []);

  async function loadCases() {
    const { data } = await supabase.from('cases').select('*, person:persons(*)').order('created_at', { ascending: false });
    setCases(data ?? []);
    setLoading(false);
  }

  const archived = cases.filter(c => c.status === 'منجزة' || c.status === 'ملغاة');
  const filtered = filter === 'all' ? archived : archived.filter(c => c.status === filter);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="الأرشيف" subtitle={`${archived.length} قضية مؤرشفة`} />

      <div className="flex gap-2 mb-4">
        {[
          { key: 'all' as const, label: 'الكل' },
          { key: 'منجزة' as const, label: 'القضايا المنجزة' },
          { key: 'ملغاة' as const, label: 'القضايا الملغاة' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${filter === f.key ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50'}`}>{f.label}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Archive size={48} />} title="لا توجد قضايا مؤرشفة" message="القضايا المنجزة والملغاة ستظهر هنا" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 text-right">
                  <th className="px-4 py-3 font-medium">رقم القضية</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-4 py-3 font-medium">المعني</th>
                  <th className="px-4 py-3 font-medium">المحكمة</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium text-center">عرض</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(c => (
                  <tr key={c.id} className="table-row-hover">
                    <td className="px-4 py-3 font-medium text-primary-600">{c.case_number}</td>
                    <td className="px-4 py-3 text-neutral-600">{formatDateShort(c.date)}</td>
                    <td className="px-4 py-3 text-neutral-700">{c.person?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.court || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => onNavigate('case-detail', c.id)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"><Eye size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
