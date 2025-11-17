import { useSelector } from 'react-redux';

export const useAuth = () => {
  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);
  return { user, token, isAuthenticated: Boolean(token) };
};
