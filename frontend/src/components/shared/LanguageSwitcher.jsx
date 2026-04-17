import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
    localStorage.setItem('sh_language', next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium"
      title={i18n.language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      {i18n.language === 'es' ? '🇲🇽 ES' : '🇺🇸 EN'}
    </button>
  );
}
