import useAuthStore from '../store/auth.store';

const ROLE_HIERARCHY = {
  ADMIN: 5,
  SH_SPECIALIST: 4,
  AREA_MANAGER: 3,
  AUDITOR: 2,
  EXECUTIVE: 1,
};

const usePermissions = () => {
  const user = useAuthStore((s) => s.user);

  const hasRole = (...roles) => user && roles.includes(user.role);
  const isAdmin = () => user?.role === 'ADMIN';
  const canWrite = () => hasRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER');
  const canDelete = () => hasRole('ADMIN', 'SH_SPECIALIST');
  const isReadOnly = () => hasRole('AUDITOR', 'EXECUTIVE');

  // Puede editar contenido normativo (requerimiento específico + campos de norma)
  const canEditNormContent = () => hasRole('ADMIN', 'SH_SPECIALIST');
  // Puede editar actividades
  const canEditActivities = () => hasRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER');

  return { hasRole, isAdmin, canWrite, canDelete, isReadOnly, canEditNormContent, canEditActivities, role: user?.role };
};

export default usePermissions;
