import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

function getLocale() {
  const lang = localStorage.getItem('sh_language') || localStorage.getItem('sh_lang') || 'es';
  return lang === 'es' ? es : enUS;
}

export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  if (!date) return '—';
  try {
    return format(new Date(date), pattern, { locale: getLocale() });
  } catch {
    return '—';
  }
};

export const formatDateLong = (date) => {
  if (!date) return '—';
  try {
    return format(new Date(date), 'PPP', { locale: getLocale() });
  } catch {
    return '—';
  }
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: getLocale() });
  } catch {
    return '—';
  }
};

export const formatEvacTime = (seconds) => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const daysUntil = (date) => {
  if (!date) return null;
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
