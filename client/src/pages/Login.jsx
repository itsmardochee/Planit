import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginSuccess, loginError } from '../store/index';
import { authAPI } from '../utils/api';
import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/LanguageSelector';

const Login = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('Form submitted, preventDefault called');
    setError('');
    setLoading(true);

    // Validation
    if (isRegister && password !== confirmPassword) {
      setError(t('auth:login.errors.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Register new user
        console.log('Attempting registration...');
        await authAPI.register({
          username,
          email,
          password,
        });

        // After successful registration, automatically log in
        console.log('Registration successful, logging in...');
        const loginResponse = await authAPI.login({ email, password });

        if (loginResponse.data.success) {
          const { user, token } = loginResponse.data.data;

          // Store token and user in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          dispatch(loginSuccess({ user, token }));
          navigate('/dashboard');
        }
      } else {
        // Login existing user
        console.log('Attempting login...');
        const response = await authAPI.login({ email, password });

        if (response.data.success) {
          const { user, token } = response.data.data;

          // Store token and user in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          dispatch(loginSuccess({ user, token }));
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      console.log('Error response:', err.response);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('common:messages.error');
      setError(message);
      dispatch(loginError(message));
    } finally {
      console.log('Finally block, setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-900 dark:to-blue-950 flex items-center justify-center px-4 transition-colors relative">
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <LanguageSelector />
        <DarkModeToggle />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">
          {isRegister ? t('auth:register.title') : t('auth:login.title')}
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth:register.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required={isRegister}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={t('auth:register.usernamePlaceholder')}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth:login.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={t('auth:login.emailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth:login.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={t('auth:register.passwordPlaceholder')}
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth:register.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required={isRegister}
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={t('auth:register.confirmPasswordPlaceholder')}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loading
              ? isRegister
                ? t('auth:register.loading')
                : t('auth:login.loading')
              : isRegister
                ? t('auth:register.signUp')
                : t('auth:login.signIn')}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isRegister
              ? t('auth:register.toggleToLogin')
              : t('auth:login.toggleToRegister')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
