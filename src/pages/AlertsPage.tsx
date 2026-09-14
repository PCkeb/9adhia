import { useEffect, useState } from 'react';
import { Bell, CalendarDays, AlertTriangle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { PageLoader, EmptyState } from '@/components/Feedback';
import { supabase } from '@/lib/supabase';
import { ALERT_DAYS } from '@/lib/constants';
import { formatDate, getDaysUntil, isTomorrow, isThisWeek } from '@/lib/date';
import type { Session } from '@/lib/types';
import type { PageKey } from '@/components/AppLayout';

interface AlertItem {
  id: string;
  session: Session & { case?: any };
  daysUntil: number;
  label: string;
}

export function AlertsPage({ onNavigate }: { onNavigate: (page: PageKey, id?: string) => void }) {
  const [sessions, setSessions] = useState<(Session & { case?: any })[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number>(7);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: sessionsData } = await supabase.from('sessions').select('*, case:cases(*)').order('date', { ascending: true });
    const { data: casesData } = await supabase.from('cases').select('*');
    setSessions(sessionsData ?? []);
    setCases(casesData ?? []);
    setLoading(false);
  }

  if (loading) return <PageLoader />;

  const upcomingSessions: AlertItem[] = sessions
    .filter(s => { const d = getDaysUntil(s.date); return d >= 0 && d <= selectedDays; })
    .map(s => ({ id: s.id, session: s, daysUntil: getDaysUntil(s.date), label: getDaysUntil(s.date) === 0 ? 'اليوم' : getDaysUntil(s.date) === 1 ? 'غداً' : `بعد ${getDaysUntil(s.date)} أيام` }));

  const noSessionCases = cases.filter(c => !sessions.some(s => s.case_id === c.id) && c.status === 'سارية');

  return (
    <div className="animate-fade-in">
      <PageHeader title="التنبيهات" subtitle="تنبيهات الجلسات والمواعيد القضائية" />

      {/* Alert Settings */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={18} className="text-primary-500" />
          <h3 className="font-bold text-neutral-800">تنبيه قبل</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALERT_DAYS.map(days => (
            <button key={days} onClick={() => setSelectedDays(days)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${selectedDays === days ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50'}`}>
              {days === 1 ? 'يوم واحد' : `${days} أيام`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-accent-500" />
            <h3 className="font-bold text-neutral-800">الجلسات القادمة</h3>
            <span className="badge bg-accent-50 text-accent-700 mr-auto">{upcomingSessions.length}</span>
          </div>
          {upcomingSessions.length === 0 ? (
            <EmptyState title="لا توجد تنبيهات" message={`لا توجد جلسات خلال ${selectedDays === 1 ? 'يوم' : `${selectedDays} أيام`}`} />
          ) : (
            <div className="space-y-2.5">
              {upcomingSessions.map(alert => (
                <div key={alert.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer" onClick={() => alert.session.case_id && onNavigate('case-detail', alert.session.case_id)}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert.daysUntil === 0 ? 'bg-error-50 text-error-600' : alert.daysUntil <= 3 ? 'bg-accent-50 text-accent-600' : 'bg-primary-50 text-primary-600'}`}>
                    <CalendarDays size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700">{alert.session.case?.case_number ?? '—'}</p>
                    <p className="text-xs text-neutral-500">{formatDate(alert.session.date)} {alert.session.time && `• ${alert.session.time}`}</p>
                  </div>
                  <span className={`badge ${alert.daysUntil === 0 ? 'bg-error-50 text-error-700' : alert.daysUntil <= 3 ? 'bg-accent-50 text-accent-700' : 'bg-primary-50 text-primary-700'}`}>{alert.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cases without sessions */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-error-500" />
            <h3 className="font-bold text-neutral-800">قضايا بدون جلسة</h3>
            <span className="badge bg-error-50 text-error-700 mr-auto">{noSessionCases.length}</span>
          </div>
          {noSessionCases.length === 0 ? (
            <EmptyState title="جميع القضايا لها جلسات" />
          ) : (
            <div className="space-y-2.5">
              {noSessionCases.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer" onClick={() => onNavigate('case-detail', c.id)}>
                  <div className="w-10 h-10 rounded-lg bg-error-50 text-error-600 flex items-center justify-center"><AlertTriangle size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700">{c.case_number}</p>
                    <p className="text-xs text-neutral-500">{c.court || '—'} • {c.case_type || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
