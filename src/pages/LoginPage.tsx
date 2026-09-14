import { useState, useEffect } from 'react';
import { Scale, Mail, Lock, User, AlertCircle, Loader2, ShieldCheck, CalendarDays, FileText, Bell, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function LoginPage() {
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setMode('reset');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error === 'Invalid login credentials' ? 'بيانات الدخول غير صحيحة' : error);
    } else if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('الرجاء إدخال الاسم الكامل');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error === 'User already registered' ? 'هذا البريد مسجل مسبقاً' : error);
      } else {
        setError(null);
        setMode('login');
        setEmail('');
        setPassword('');
      }
    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error);
      } else {
        setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      }
    } else if (mode === 'reset') {
      if (newPassword.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('كلمتا المرور غير متطابقتين');
        setLoading(false);
        return;
      }
      const { error } = await updatePassword(newPassword);
      if (error) {
        setError(error);
      } else {
        setSuccess('تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.');
        setMode('login');
        setNewPassword('');
        setConfirmPassword('');
        window.location.hash = '';
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Right side - Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary-400 blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-primary-300 blur-3xl" />
        </div>

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-8 border border-white/20 shadow-lg">
            <Scale size={36} className="text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4 tracking-tight">
            نظام متابعة القضايا
            <br />
            والجلسات القضائية
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed max-w-md">
            منصة متكاملة لإدارة القضايا والجلسات والمرفقات القضائية، مع نظام تنبيهات ذكي وتقارير شاملة.
          </p>

          <div className="mt-12 space-y-4">
            {[
              { icon: <Scale size={16} />, text: 'إدارة شاملة للقضايا والمعنيين' },
              { icon: <CalendarDays size={16} />, text: 'تتبع الجلسات والمواعيد القضائية' },
              { icon: <Bell size={16} />, text: 'تنبيهات تلقائية قبل المواعيد' },
              { icon: <FileText size={16} />, text: 'تقارير وإحصائيات تفصيلية' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-primary-100">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/15 backdrop-blur-sm">
                  {item.icon}
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 flex items-center gap-2 text-primary-300 text-xs">
            <ShieldCheck size={14} />
            <span>نظام آمن ومحمي</span>
          </div>
        </div>
      </div>

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 bg-neutral-50">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Scale size={32} />
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-neutral-800 text-center mb-2 tracking-tight">
            {mode === 'login' ? 'تسجيل الدخول'
             : mode === 'signup' ? 'إنشاء حساب جديد'
             : mode === 'forgot' ? 'استعادة كلمة المرور'
             : 'كلمة مرور جديدة'}
          </h2>
          <p className="text-sm text-neutral-500 text-center mb-8 px-2">
            {mode === 'login' ? 'أدخل بياناتك للوصول إلى النظام'
             : mode === 'signup' ? 'أنشئ حساباً للبدء باستخدام النظام'
             : mode === 'forgot' ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين'
             : 'أدخل كلمة مرورك الجديدة'}
          </p>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm animate-fade-in">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-success-50 border border-success-200 text-success-700 text-sm animate-fade-in">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">الاسم الكامل</label>
                <div className="relative">
                  <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input pr-10"
                    placeholder="أدخل الاسم الكامل"
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div>
                <label className="label">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input pr-10"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">كلمة المرور</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div>
                  <label className="label">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <KeyRound size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="input pr-10"
                      placeholder="•••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="input pr-10"
                      placeholder="•••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'login' && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-600">تذكرني</span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base shadow-md shadow-primary-500/20"
            >
              {loading
                ? <Loader2 size={20} className="animate-spin" />
                : mode === 'login' ? 'تسجيل الدخول'
                : mode === 'signup' ? 'إنشاء الحساب'
                : mode === 'forgot' ? 'إرسال رابط الاستعادة'
                : 'حفظ كلمة المرور الجديدة'
              }
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                className="flex items-center justify-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors mx-auto"
              >
                <ArrowRight size={16} />
                العودة لتسجيل الدخول
              </button>
            )}
            {mode === 'reset' && (
              <button
                onClick={() => { setMode('login'); setError(null); setSuccess(null); window.location.hash = ''; }}
                className="flex items-center justify-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors mx-auto"
              >
                <ArrowRight size={16} />
                العودة لتسجيل الدخول
              </button>
            )}
            {mode !== 'forgot' && mode !== 'reset' && (
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null); }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                {mode === 'login' ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : 'لديك حساب بالفعل؟ سجل الدخول'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
