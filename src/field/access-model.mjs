export const ACCESS_ROLES = { admin: 'Administrador', coordenador: 'Coordenador', tecnico: 'Tecnico', agente: 'Agente', auditor: 'Auditor' };

export function manageableRoles(profile) {
  if (profile?.papel === 'super_admin') return Object.keys(ACCESS_ROLES);
  if (profile?.papel === 'admin') return ['coordenador', 'tecnico', 'agente', 'auditor'];
  if (profile?.papel === 'coordenador') return ['tecnico', 'agente', 'auditor'];
  return [];
}

export function canManageAccess(profile, target) {
  return profile?.id !== target?.id && manageableRoles(profile).includes(target?.papel);
}
