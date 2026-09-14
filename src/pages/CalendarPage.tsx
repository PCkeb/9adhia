import { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { PageLoader } from '@/components/Feedback';
import { supabase } from '@/lib/supabase';
import { ARABIC_MONTHS, ARABIC_WEEKDAYS_SHORT, getDaysUntil, isToday } from '@/lib/date';
import type { Session } from '@/lib/types';
import type { PageKey } from '@/components/AppLayout';

export function CalendarPage({ onNavigate }: { onNavigate: (page: PageKey, id?: string) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<(Session & { case?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    const { data } = await supabase.from('sessions').select('*, case:cases(*)').order('date', { ascending: true });
    setSessions(data ?? []);
    setLoading(false);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const sessionsByDate: Record<string, (Session & { case?: any })[]> = {};
  sessions.forEach(s => {
    const key = s.date;
    if (!sessionsByDate[key]) sessionsByDate[key] = [];
    sessionsByDate[key].push(s);
  });

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  function changeMonth(delta: number) {
    setCurrentDate(new Date(year, month + delta, 1));
    setSelectedDay(null);
  }

  function dateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const selectedSessions = selectedDay ? (sessionsByDate[selectedDay] ?? []) : [];

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="التقويم القضائي" subtitle={`${ARABIC_MONTHS[month]} ${year}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-neutral-800">{ARABIC_MONTHS[month]} {year}</h3>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"><ChevronRight size={20} /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 transition-colors">اليوم</button>
              <button onClick={() => changeMonth(1)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"><ChevronLeft size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {ARABIC_WEEKDAYS_SHORT.map(day => (
              <div key={day} className="text-center text-xs font-medium text-neutral-400 py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={i} />;
              const ds = dateStr(day);
              const daySessions = sessionsByDate[ds] ?? [];
              const today = isToday(ds);
              const selected = selectedDay === ds;
              const hasSessions = daySessions.length > 0;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(selected ? null : ds)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all duration-200 relative ${
                    selected ? 'bg-primary-600 text-white shadow-md' :
                    today ? 'bg-primary-50 text-primary-700 font-bold ring-1 ring-primary-300' :
                    hasSessions ? 'bg-neutral-50 text-neutral-700 hover:bg-primary-50' :
                    'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <span>{day}</span>
                  {hasSessions && !selected && (
                    <div className="flex gap-0.5 mt-0.5">
                      {daySessions.slice(0, 3).map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${today ? 'bg-primary-500' : 'bg-primary-400'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Details */}
        <div className="card p-5">
          <h3 className="font-bold text-neutral-800 mb-4">
            {selectedDay ? `جلسات ${formatSelectedDate(selectedDay)}` : 'اختر يوماً لعرض الجلسات'}
          </h3>
          {selectedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays size={40} className="text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">{selectedDay ? 'لا توجد جلسات في هذا اليوم' : 'انقر على أي يوم في التقويم'}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedSessions.map(s => {
                const days = getDaysUntil(s.date);
                return (
                  <div key={s.id} className="p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer" onClick={() => s.case_id && onNavigate('case-detail', s.case_id)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-primary-600">{s.case?.case_number ?? '—'}</span>
                      {s.time && <span className="text-xs text-neutral-500" dir="ltr">{s.time}</span>}
                    </div>
                    <p className="text-xs text-neutral-600">{s.court} {s.room && `• ${s.room}`}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-neutral-500">{s.result}</span>
                      {days >= 0 && <span className={`badge ${days === 0 ? 'bg-accent-50 text-accent-700' : 'bg-primary-50 text-primary-700'}`}>{days === 0 ? 'اليوم' : `${days} يوم`}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatSelectedDate(ds: string): string {
  const d = new Date(ds);
  return d.toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
