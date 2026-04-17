/**
 * Calcula el status de un requerimiento basado en sus actividades.
 * @param {Array} activities - actividades del requerimiento
 * @param {string} currentStatus - status actual (para respetar NOT_APPLICABLE)
 * @returns {{ status: string, completedAt: Date|null } | null}
 */
function computeRequirementStatus(activities, currentStatus) {
  if (currentStatus === 'NOT_APPLICABLE') {
    return { status: 'NOT_APPLICABLE', completedAt: null };
  }
  if (!activities || activities.length === 0) {
    return null; // sin actividades: no recalcular, respetar valor manual
  }

  const now = new Date();
  const allCompleted  = activities.every(a => a.activityStatus === 'COMPLETED');
  const anyOverdue    = activities.some(
    a => a.activityStatus !== 'COMPLETED' && new Date(a.dueDate) < now
  );
  const anyStarted    = activities.some(
    a => a.activityStatus === 'IN_PROGRESS' || a.activityStatus === 'COMPLETED'
  );

  if (allCompleted)  return { status: 'COMPLETED',   completedAt: now };
  if (anyOverdue)    return { status: 'OVERDUE',      completedAt: null };
  if (anyStarted)    return { status: 'IN_PROGRESS',  completedAt: null };

  return { status: 'PENDING', completedAt: null };
}

module.exports = { computeRequirementStatus };
