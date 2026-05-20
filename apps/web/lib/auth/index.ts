export { AuthProvider } from './auth-provider';
export { AuthContext, useAuth } from './auth-context';
export type { AuthContextValue } from './auth-context';
export {
  hasPermission,
  canAccessRoute,
  getAllowedRoutes,
  ROLE_PERMISSIONS,
  type Permission,
} from './permissions';
