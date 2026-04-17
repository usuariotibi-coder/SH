import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';
import { formatDateTime } from '../../utils/formatDate';
import api from '../../api/axios.config';

export default function IncidentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);

  useEffect(() => {
    api.get(`/incidents/${id}`).then(r => setIncident(r.data)).catch(() => toast.error('Error al cargar'));
  }, [id]);

  if (!incident) return <div className="py-12 text-center text-[var(--color-text-muted)]">{t('common.loading')}</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/incidents')} className="p-2 rounded-md hover:bg-gray-100 text-[var(--color-text-muted)]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display">{incident.folio}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{t(`incidents.types.${incident.type}`)}</p>
        </div>
        <StatusPill status={incident.severity} customLabel={t(`incidents.severities.${incident.severity}`)} />
      </div>

      <Card>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-xs text-[var(--color-text-muted)]">{t('common.date')}</p><p className="font-medium">{formatDateTime(incident.occurredAt)}</p></div>
          <div><p className="text-xs text-[var(--color-text-muted)]">{t('common.area')}</p><p className="font-medium">{incident.area}</p></div>
          <div><p className="text-xs text-[var(--color-text-muted)]">{t('common.status')}</p><p className="font-medium">{incident.isClosed ? t('incidents.isClosed') : t('common.inProgress')}</p></div>
          <div><p className="text-xs text-[var(--color-text-muted)]">{t('incidents.lostDays')}</p><p className="font-medium">{incident.lostDays}</p></div>
          <div><p className="text-xs text-[var(--color-text-muted)]">Lesionado</p><p className="font-medium">{incident.injuredName || '—'}</p></div>
          <div><p className="text-xs text-[var(--color-text-muted)]">{t('incidents.imssReport')}</p><p className="font-medium">{incident.isReportedIMSS ? `${t('common.yes')} — ${incident.imssReportNo || ''}` : t('common.no')}</p></div>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-3">
          <div><p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">{t('common.description')}</p><p className="text-sm">{incident.description}</p></div>
          {incident.rootCause && <div><p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">{t('incidents.rootCause')}</p><p className="text-sm">{incident.rootCause}</p></div>}
          {incident.correctiveAction && <div><p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">{t('incidents.correctiveAction')}</p><p className="text-sm">{incident.correctiveAction}</p></div>}
        </div>
      </Card>
    </div>
  );
}
