import { useEffect, useState } from 'react';
import {
  Scale, CheckCircle2, XCircle, Clock, CalendarDays,
  Paperclip, Users, Bell, FileText, Plus, Activity as ActivityIcon,
  AlertTriangle, FolderOpen, TrendingUp, Check, X, Clock4,
  Phone, MapPin, ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, StatCard } from '@/components/Layout';
import { StatusBadge } from '@/components/Badge';
import { PageLoader, EmptyState } from '@/components/Feedback';
import { formatDate, formatDateTime, isTomorrow, isThisWeek, getDaysUntil, getWeekdayName } from '@/lib/date';
import { useAuth } from '@/lib/auth';
import type { PageKey } from '@/components/AppLayout';
import type { Activity, Session } from '@/lib/types';

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  cancelledCases: number;
  postponedCases: number;
  weekSessions: number;
  totalAttachments: number;
  totalPersons: number;
}

interface AlertItem {
  id: string;
  type: 'tomorrow' | 'week' | 'missing' | 'no-session';
  label: string;
  count: number;
}

export function DashboardPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const { canEdit } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const [casesRes, personsRes, attachmentsRes, sessionsRes, activitiesRes] = await Promise.all([
      supabase.from('cases').select('id, status'),
      supabase.from('persons').select('id', { count: 'exact', head: true }),
      supabase.from('attachments').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('*, case:cases(*, person:persons(*))').order('date', { ascending: true }),
      supabase.from('activities').select('*, profiles:user_id(*)').order('created_at', { ascending: false }).limit(8),
    ]);

    const cases = casesRes.data ?? [];
    const sessions = sessionsRes.data ?? [];
    const acts = activitiesRes.data ?? [];

    const statusCounts: Record<string, number> = {};
    cases.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1; });

    setStats({
      totalCases: cases.length,
      activeCases: statusCounts['سارية'] ?? 0,
      completedCases: statusCounts['منجزة'] ?? 0,
      cancelledCases: statusCounts['ملغاة'] ?? 0,
      postponedCases: statusCounts['مؤجلة'] ?? 0,
      weekSessions: sessions.filter(s => isThisWeek(s.date)).length,
      totalAttachments: attachmentsRes.count ?? 0,
      totalPersons: personsRes.count ?? 0,
    });

    const tomorrowSessions = sessions.filter(s => isTomorrow(s.date)).length;
    const weekSessions = sessions.filter(s => isThisWeek(s.date)).length;
    const noSessionCases = cases.filter(c => !sessions.some(s => s.case_id === c.id)).length;

    const alertItems: AlertItem[] = [];
    if (tomorrowSessions > 0) alertItems.push({ id: 'tomorrow', type: 'tomorrow', label: 'جلسات غداً', count: tomorrowSessions });
    if (weekSessions > 0) alertItems.push({ id: 'week', type: 'week', label: 'جلسات هذا الأسبوع', count: weekSessions });
    if (noSessionCases > 0) alertItems.push({ id: 'no-session', type: 'no-session', label: 'قضايا بدون جلسة', count: noSessionCases });
    setAlerts(alertItems);

    setActivities(acts as Activity[]);
    setUpcomingSessions(sessions.filter(s => getDaysUntil(s.date) >= 0 && getDaysUntil(s.date) <= 7).slice(0, 6));

    setLoading(false);
  }

  async function handleSessionAction(sessionId: string, result: string) {
    setActionLoading(sessionId);
    await supabase.from('sessions').update({ result }).eq('id', sessionId);
    const session = upcomingSessions.find(s => s.id === sessionId);
    if (session?.case_id) {
      await supabase.from('activities').insert({ case_id: session.case_id, action: `تحديث نتيجة الجلسة: ${result}` });
    }
    setActionLoading(null);
    loadDashboard();
  }

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="لوحة التحكم"
        subtitle="نظرة عامة على القضايا والجلسات والتنبيهات"
        actions={
          <button className="btn-primary" onClick={() => onNavigate('cases')}>
            <Plus size={18} />
            إضافة قضية
          </button>
        }
      />


      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard icon={<Scale size={22} />} label="إجمالي القضايا" value={stats?.totalCases ?? 0} color="primary" />
        <StatCard icon={<Clock size={22} />} label="القضايا السارية" value={stats?.activeCases ?? 0} color="primary" />
        <StatCard icon={<CheckCircle2 size={22} />} label="القضايا المنجزة" value={stats?.completedCases ?? 0} color="success" />
        <StatCard icon={<XCircle size={22} />} label="القضايا الملغاة" value={stats?.cancelledCases ?? 0} color="error" />
        <StatCard icon={<AlertTriangle size={22} />} label="القضايا المؤجلة" value={stats?.postponedCases ?? 0} color="warning" />
        <StatCard icon={<CalendarDays size={22} />} label="جلسات هذا الأسبوع" value={stats?.weekSessions ?? 0} color="warning" />
        <StatCard icon={<Paperclip size={22} />} label="عدد المرفقات" value={stats?.totalAttachments ?? 0} color="neutral" />
        <StatCard icon={<Users size={22} />} label="عدد المعنيين" value={stats?.totalPersons ?? 0} color="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-accent-500" />
            <h3 className="font-bold text-neutral-800">التنبيهات</h3>
          </div>
          {alerts.length === 0 ? (
            <EmptyState title="لا توجد تنبيهات" message="جميع المواعيد تحت السيطرة" />
          ) : (
            <div className="space-y-2.5">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      alert.type === 'tomorrow' ? 'bg-accent-50 text-accent-600' :
                      alert.type === 'week' ? 'bg-primary-50 text-primary-600' :
                      'bg-error-50 text-error-600'
                    }`}>
                      {alert.type === 'no-session' ? <AlertTriangle size={18} /> : <CalendarDays size={18} />}
                    </div>
                    <span className="text-sm font-medium text-neutral-700">{alert.label}</span>
                  </div>
                  <span className="text-lg font-bold text-neutral-800">{alert.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ActivityIcon size={18} className="text-success-500" />
            <h3 className="font-bold text-neutral-800">آخر النشاطات</h3>
          </div>
          {activities.length === 0 ? (
            <EmptyState title="لا توجد نشاطات" />
          ) : (
            <div className="space-y-3">
              {activities.map(act => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center shrink-0">
                    <FileText size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700">{act.action}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{formatDateTime(act.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-primary-500" />
            <h3 className="font-bold text-neutral-800">إجراءات سريعة</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'إضافة قضية', icon: <Scale size={20} />, page: 'cases' as PageKey, color: 'primary' },
              { label: 'إضافة معني', icon: <Users size={20} />, page: 'persons' as PageKey, color: 'success' },
              { label: 'إضافة جلسة', icon: <CalendarDays size={20} />, page: 'sessions' as PageKey, color: 'warning' },
              { label: 'رفع مرفق', icon: <FolderOpen size={20} />, page: 'attachments' as PageKey, color: 'neutral' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => onNavigate(action.page)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  action.color === 'primary' ? 'bg-primary-50 text-primary-600' :
                  action.color === 'success' ? 'bg-success-50 text-success-600' :
                  action.color === 'warning' ? 'bg-accent-50 text-accent-600' :
                  'bg-neutral-100 text-neutral-600'
                } group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <span className="text-sm font-medium text-neutral-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
 {/* Upcoming Sessions as Cards */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-primary-500" />
            <h3 className="font-bold text-neutral-800 text-lg">الجلسات القادمة</h3>
          </div>
          <button onClick={() => onNavigate('sessions')} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
            عرض الكل
            <ArrowLeft size={16} />
          </button>
        </div>

        {upcomingSessions.length === 0 ? (
          <div className="card p-8">
            <EmptyState icon={<CalendarDays size={48} />} title="لا توجد جلسات قادمة" message="لا توجد جلسات مجدولة خلال الأسبوع القادم" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {upcomingSessions.map(s => {
              const person = s.case?.person;
              const days = getDaysUntil(s.date);
              const isToday = days === 0;
              const isTomorrowSession = days === 1;
              const dateObj = new Date(s.date);
              const dayNum = dateObj.getDate();
              const weekday = getWeekdayName(s.date);

              return (
                <div
                  key={s.id}
                  className={`card overflow-hidden transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5 ${
                    isToday ? 'ring-2 ring-accent-300' : isTomorrowSession ? 'ring-1 ring-primary-200' : ''
                  }`}
                >
                  {/* Card header with date badge */}
                  <div className="flex items-start gap-3 p-4 pb-3">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                      isToday ? 'bg-accent-100 text-accent-700' :
                      isTomorrowSession ? 'bg-primary-100 text-primary-700' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      <span className="text-xl font-bold leading-none font-display">{dayNum}</span>
                      <span className="text-[10px] mt-0.5">{weekday}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isToday && <span className="badge bg-accent-100 text-accent-700 text-[10px] px-2 py-0.5">اليوم</span>}
                        {isTomorrowSession && !isToday && <span className="badge bg-primary-100 text-primary-700 text-[10px] px-2 py-0.5">غداً</span>}
                        {!isToday && !isTomorrowSession && days > 0 && days <= 7 && (
                          <span className="badge bg-neutral-100 text-neutral-500 text-[10px] px-2 py-0.5">بعد {days} أيام</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-neutral-800 truncate">{person?.full_name ?? '—'}</h4>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">{s.case?.case_number ?? '—'}</p>
                    </div>
                  </div>

                  {/* Session details */}
                  <div className="px-4 pb-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <Clock4 size={14} className="text-neutral-400 shrink-0" />
                      <span>{formatDate(s.date)} {s.time && `• ${s.time}`}</span>
                    </div>
                    {s.court && (
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <MapPin size={14} className="text-neutral-400 shrink-0" />
                        <span className="truncate">{s.court}{s.room && ` • ${s.room}`}</span>
                      </div>
                    )}
                    {person?.phone && (
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <Phone size={14} className="text-neutral-400 shrink-0" />
                        <span dir="ltr">{person.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {canEdit && (
                    <div className="flex gap-1.5 p-3 pt-2 border-t border-neutral-100 bg-neutral-50/50">
                      <button
                        onClick={() => handleSessionAction(s.id, 'حكم')}
                        disabled={actionLoading === s.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-success-50 text-success-700 hover:bg-success-100 transition-colors disabled:opacity-50"
                      >
                        <Check size={14} />
                        إنجاز
                      </button>
                      <button
                        onClick={() => handleSessionAction(s.id, 'تأجيل')}
                        disabled={actionLoading === s.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-accent-50 text-accent-700 hover:bg-accent-100 transition-colors disabled:opacity-50"
                      >
                        <Clock4 size={14} />
                        تأجيل
                      </button>
                      <button
                        onClick={() => handleSessionAction(s.id, 'شطب')}
                        disabled={actionLoading === s.id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-error-50 text-error-600 hover:bg-error-100 transition-colors disabled:opacity-50"
                      >
                        <X size={14} />
                        إلغاء
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
      
     
  );
}
