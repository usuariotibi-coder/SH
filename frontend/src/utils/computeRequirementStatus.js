/**
 * Calcula el status de un requerimiento basado en sus actividades (versión frontend).
 *
 * @param {Array} activities
 * @param {string} currentStatus
 * @returns {string} status calculado
 */
export function computeRequirementStatus(activities, currentStatus) {
  if (currentStatus === 'NOT_APPLICABLE') return 'NOT_APPLICABLE';
  if (!activities || activities.length === 0) return currentStatus;

  const now = new Date();
  const allCompleted  = activities.every(a => a.activityStatus === 'COMPLETED');
  const anyOverdue    = activities.some(
    a => a.activityStatus !== 'COMPLETED' && new Date(a.dueDate) < now
  );
  const anyStarted    = activities.some(
    a => a.activityStatus === 'IN_PROGRESS' || a.activityStatus === 'COMPLETED'
  );

  if (allCompleted)  return 'COMPLETED';
  if (anyOverdue)    return 'OVERDUE';
  if (anyStarted)    return 'IN_PROGRESS';
  return 'PENDING';
}
