import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AppLayout, type PageKey } from '@/components/AppLayout';
import { FullPageLoader } from '@/components/Feedback';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PersonsPage, PersonDetailPage } from '@/pages/PersonsPage';
import { CasesPage, CaseDetailPage } from '@/pages/CasesPage';
import { SessionsPage } from '@/pages/SessionsPage';
import { AttachmentsPage } from '@/pages/AttachmentsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ArchivePage } from '@/pages/ArchivePage';
import { AlertsPage } from '@/pages/AlertsPage';
import { UsersPage } from '@/pages/UsersPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { BackupPage } from '@/pages/BackupPage';

function AppContent() {
  const { session, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [detailId, setDetailId] = useState<string | null>(null);

  if (loading) return <FullPageLoader />;

  if (!session) return <LoginPage />;

  function navigate(page: PageKey, id?: string) {
    setCurrentPage(page);
    if (id) setDetailId(id);
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage onNavigate={navigate} />;
      case 'persons': return <PersonsPage onNavigate={navigate} />;
      case 'person-detail': return detailId ? <PersonDetailPage personId={detailId} onNavigate={navigate} /> : <PersonsPage onNavigate={navigate} />;
      case 'cases': return <CasesPage onNavigate={navigate} />;
      case 'case-detail': return detailId ? <CaseDetailPage caseId={detailId} onNavigate={navigate} /> : <CasesPage onNavigate={navigate} />;
      case 'sessions': return <SessionsPage onNavigate={navigate} />;
      case 'attachments': return <AttachmentsPage onNavigate={navigate} />;
      case 'calendar': return <CalendarPage onNavigate={navigate} />;
      case 'reports': return <ReportsPage />;
      case 'archive': return <ArchivePage onNavigate={navigate} />;
      case 'alerts': return <AlertsPage onNavigate={navigate} />;
      case 'users': return <UsersPage />;
      case 'settings': return <SettingsPage />;
      case 'backup': return <BackupPage />;
      default: return <DashboardPage onNavigate={navigate} />;
    }
  }

  return (
    <AppLayout currentPage={currentPage} onNavigate={navigate}>
      {renderPage()}
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
