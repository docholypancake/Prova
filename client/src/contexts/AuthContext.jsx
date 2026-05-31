import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout as apiLogout } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false, // 401 = not logged in, don't retry
    staleTime: 5 * 60 * 1000,
  });

  const logout = async () => {
    await apiLogout();
    queryClient.setQueryData(['me'], null);
    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const value = {
    user: isError ? null : user || null,
    isAuthenticated: !!user && !isError,
    isLoading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
