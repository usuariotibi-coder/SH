import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/auth.store';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isLoading, token } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  if (token) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email requerido';
    if (!form.password) e.password = 'Contraseña requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(form.email, form.password);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-primary-dark)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-accent)] rounded-2xl mb-4">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">SH México</h1>
          <p className="text-white/60 text-sm mt-1">Seguridad e Higiene Industrial</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[var(--radius-lg)] p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6 font-display">{t('auth.login')}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--color-text)]">
                {t('auth.email')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className={`w-full px-3 py-2.5 border rounded-[var(--radius-sm)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.email ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                placeholder="usuario@empresa.com"
                autoFocus
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--color-text)]">
                {t('auth.password')} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className={`w-full px-3 py-2.5 border rounded-[var(--radius-sm)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.password ? 'border-red-500' : 'border-[var(--color-border)]'}`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full justify-center py-2.5">
              {isLoading ? t('auth.loading') : t('auth.login')}
            </Button>
          </form>

          <p className="text-xs text-center text-[var(--color-text-muted)] mt-6">
            Demo: admin@shmexicoapp.com / Admin1234!
          </p>
        </div>
      </div>
    </div>
  );
}
