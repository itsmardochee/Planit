import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginSuccess, loginError } from '../store/index';
import { authAPI } from '../utils/api';

const Login = () => {
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
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await authAPI.register({ username, email, password });
        // After successful registration, automatically log in
        const loginResponse = await authAPI.login({ email, password });
        const { user, token } = loginResponse.data;
        dispatch(loginSuccess({ user, token }));
      } else {
        const response = await authAPI.login({ email, password });
        const { user, token } = response.data;
        dispatch(loginSuccess({ user, token }));
      }
      navigate('/dashboard');
    } catch (err) {
      const message = err?.response?.data?.message || 'An error occurred';
      setError(message);
      dispatch(loginError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-4">
          {isRegister ? 'Create an account' : 'Sign in to Planit'}
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required={isRegister}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Your username"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Your password"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Confirm password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : isRegister
              ? 'Create account'
              : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 hover:underline"
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          This page uses mock authentication for UI testing.
        </p>
      </div>
    </div>
  );
};

export default Login;
