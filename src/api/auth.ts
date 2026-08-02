import axiosInstance from './axiosConfig';

export const isAuthenticated = (): boolean => !!localStorage.getItem('access_token');

export const logout = async (): Promise<void> => {
  try {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) await axiosInstance.post('auth/logout/', { refresh });
  } catch {
    // Silently ignore — on déconnecte quand même
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }
};
