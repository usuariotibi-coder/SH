import useAuthStore from '../store/auth.store';

const useAuth = () => {
  const { user, token, isLoading, error, login, logout, fetchMe, clearError } = useAuthStore();
  return { user, token, isLoading, error, login, logout, fetchMe, clearError, isAuthenticated: !!token };
};

export default useAuth;
