import { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Trash2, Mail, User as UserIcon } from 'lucide-react';
import { PageHeader } from '@/components/Layout';
import { Modal, ConfirmModal } from '@/components/Modal';
import { PageLoader, EmptyState, ErrorState } from '@/components/Feedback';
import { RoleBadge } from '@/components/Badge';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/date';
import type { Profile } from '@/lib/types';

export function UsersPage() {
  const { isManager, profile: currentUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setUsers(data ?? []);
    setLoading(false);
  }

  async function handleAddUser(email: string, password: string, fullName: string, role: string) {
    const { error } = await supabase.auth.admin.createUser({ email, password, user_metadata: { full_name: fullName } });
    if (error) { setError(error.message); return; }
    setAddModalOpen(false);
    loadUsers();
  }

  async function handleUpdateRole(user: Profile, newRole: string) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    setEditTarget(null);
    loadUsers();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('profiles').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadUsers();
  }

  if (!isManager) {
    return <EmptyState icon={<ShieldCheck size={48} />} title="غير مصرح" message="هذه الصفحة متاحة للمدير فقط" />;
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={loadUsers} />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="إدارة المستخدمين" subtitle={`${users.length} مستخدم`}
        actions={<button className="btn-primary" onClick={() => setAddModalOpen(true)}><Plus size={18} /> إضافة مستخدم</button>}
      />

      {/* Role descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { role: 'manager', label: 'المدير', desc: 'كامل الصلاحيات', color: 'primary' },
          { role: 'employee', label: 'الموظف', desc: 'إضافة وتعديل', color: 'success' },
          { role: 'reader', label: 'قارئ فقط', desc: 'مشاهدة وطباعة', color: 'neutral' },
        ].map(r => (
          <div key={r.role} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <RoleBadge role={r.role} />
            </div>
            <p className="text-sm text-neutral-600">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {users.length === 0 ? (
          <EmptyState icon={<UserIcon size={48} />} title="لا يوجد مستخدمون" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 text-right">
                  <th className="px-4 py-3 font-medium">الاسم</th>
                  <th className="px-4 py-3 font-medium">الدور</th>
                  <th className="px-4 py-3 font-medium">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 font-medium text-center">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map(u => (
                  <tr key={u.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">{u.full_name?.charAt(0) ?? '?'}</div>
                        <div>
                          <p className="text-neutral-800 font-medium">{u.full_name || 'بدون اسم'}</p>
                          {u.id === currentUser?.id && <span className="text-xs text-primary-500">أنت</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setEditTarget(u)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-accent-50 hover:text-accent-600 transition-colors" title="تغيير الدور"><ShieldCheck size={16} /></button>
                        {u.id !== currentUser?.id && <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-error-50 hover:text-error-500 transition-colors" title="حذف"><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddUserModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAddUser} />
      <EditRoleModal open={!!editTarget} onClose={() => setEditTarget(null)} user={editTarget} onUpdate={handleUpdateRole} />
      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="حذف مستخدم" message={`هل أنت متأكد من حذف "${deleteTarget?.full_name}"؟`} confirmLabel="حذف" />
    </div>
  );
}

function AddUserModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (email: string, password: string, fullName: string, role: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('employee');

  return (
    <Modal open={open} onClose={onClose} title="إضافة مستخدم" size="md"
      footer={<><button className="btn-secondary" onClick={onClose}>إلغاء</button><button className="btn-primary" onClick={() => onAdd(email, password, fullName, role)} disabled={!email || !password || !fullName}>إضافة</button></>}
    >
      <div className="space-y-4">
        <div><label className="label">الاسم الكامل <span className="text-error-500">*</span></label><input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="الاسم الكامل" /></div>
        <div><label className="label">البريد الإلكتروني <span className="text-error-500">*</span></label><div className="relative"><Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input className="input pr-10" dir="ltr" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" /></div></div>
        <div><label className="label">كلمة المرور <span className="text-error-500">*</span></label><input className="input" dir="ltr" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} /></div>
        <div>
          <label className="label">الدور</label>
          <select className="input" value={role} onChange={e => setRole(e.target.value)}>
            <option value="manager">مدير</option>
            <option value="employee">موظف</option>
            <option value="reader">قارئ فقط</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

function EditRoleModal({ open, onClose, user, onUpdate }: { open: boolean; onClose: () => void; user: Profile | null; onUpdate: (user: Profile, role: string) => void }) {
  const [role, setRole] = useState('employee');
  useEffect(() => { if (user) setRole(user.role); }, [user, open]);

  if (!user) return null;
  return (
    <Modal open={open} onClose={onClose} title="تغيير الدور" size="sm"
      footer={<><button className="btn-secondary" onClick={onClose}>إلغاء</button><button className="btn-primary" onClick={() => onUpdate(user, role)}>حفظ</button></>}
    >
      <div className="space-y-3">
        <p className="text-sm text-neutral-600">المستخدم: <span className="font-medium text-neutral-800">{user.full_name}</span></p>
        <div>
          <label className="label">الدور</label>
          <select className="input" value={role} onChange={e => setRole(e.target.value)}>
            <option value="manager">مدير</option>
            <option value="employee">موظف</option>
            <option value="reader">قارئ فقط</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
