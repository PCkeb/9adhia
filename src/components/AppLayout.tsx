import { type ReactNode, useState } from 'react';
import {
  LayoutDashboard, Users, Scale, CalendarDays, FileText,
  Archive, Bell, Settings, Database, FolderOpen, LogOut, Menu, X,
  ChevronLeft, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { RoleBadge } from '@/components/Badge';

export type PageKey =
  | 'dashboard' | 'persons' | 'person-detail' | 'cases' | 'case-detail'
  | 'sessions' | 'attachments' | 'calendar' | 'reports' | 'archive'
  | 'alerts' | 'users' | 'settings' | 'backup';

interface NavItem {
  key: PageKey;
  label: string;
  icon: ReactNode;
  managerOnly?: boolean;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'الرئيسية',
    items: [
      { key: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={20} /> },
    ],
  },
  {
    title: 'القضايا',
    items: [
      { key: 'persons', label: 'المعنيون بالقضايا', icon: <Users size={20} /> },
      { key: 'cases', label: 'القضايا', icon: <Scale size={20} /> },
      { key: 'sessions', label: 'الجلسات', icon: <CalendarDays size={20} /> },
      { key: 'attachments', label: 'المرفقات', icon: <FolderOpen size={20} /> },
    ],
  },
  {
    title: 'الأدوات',
    items: [
      { key: 'calendar', label: 'التقويم القضائي', icon: <CalendarDays size={20} /> },
      { key: 'reports', label: 'التقارير', icon: <FileText size={20} /> },
      { key: 'archive', label: 'الأرشيف', icon: <Archive size={20} /> },
      { key: 'alerts', label: 'التنبيهات', icon: <Bell size={20} /> },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { key: 'users', label: 'المستخدمون', icon: <ShieldCheck size={20} />, managerOnly: true },
      { key: 'settings', label: 'الإعدادات', icon: <Settings size={20} /> },
      { key: 'backup', label: 'النسخ الاحتياطي', icon: <Database size={20} />, managerOnly: true },
    ],
  },
];

interface AppLayoutProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function AppLayout({ currentPage, onNavigate, children }: AppLayoutProps) {
  const { profile, signOut, isManager } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleGroups = NAV_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(item => !item.managerOnly || isManager),
  })).filter(g => g.items.length > 0);

  function handleNav(key: PageKey) {
    onNavigate(key);
    setMobileOpen(false);
  }

  const sidebar = (
    <aside className="w-64 sm:w-72 bg-white border-l border-neutral-200 flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-md shadow-primary-500/30">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="font-display font-bold text-neutral-800 text-sm leading-tight">نظام متابعة</h1>
            <p className="text-xs text-neutral-500">القضايا والجلسات القضائية</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {visibleGroups.map(group => (
          <div key={group.title}>
            <p className="text-[11px] font-semibold text-neutral-400 px-3 mb-2 uppercase tracking-wider">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(item => {
                const active = currentPage === item.key || (currentPage === 'person-detail' && item.key === 'persons') || (currentPage === 'case-detail' && item.key === 'cases');
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNav(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                    }`}
                  >
                    <span className={`transition-colors ${active ? 'text-primary-600' : 'text-neutral-400'}`}>{item.icon}</span>
                    {item.label}
                    {active && <ChevronLeft size={16} className="mr-auto text-primary-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile footer */}
      <div className="px-3 py-4 border-t border-neutral-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
            {profile?.full_name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-700 truncate">{profile?.full_name || 'مستخدم'}</p>
            <div className="mt-0.5">
              {profile && <RoleBadge role={profile.role} />}
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-500 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <div className="hidden lg:flex">{sidebar}</div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative animate-slide-in">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Scale size={20} className="text-primary-600" />
            <span className="font-display font-bold text-sm text-neutral-800">نظام متابعة القضايا</span>
          </div>
          <button onClick={signOut} className="p-2 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-500">
            <LogOut size={18} />
          </button>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
