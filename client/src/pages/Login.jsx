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
      // TEMPORARY: Commented out validation to view frontend pages
      // if (isRegister) {
      //   if (password !== confirmPassword) {
      //     setError('Les mots de passe ne correspondent pas');
      //     setLoading(false);
      //     return;
      //   }
      //   await authAPI.register({ username, email, password });
      //   setError('');
      //   setIsRegister(false);
      //   setUsername('');
      //   setEmail('');
      //   setPassword('');
      //   setConfirmPassword('');
      // } else {
      //   const response = await authAPI.login({ email, password });
      //   const { user, token } = response.data.data;
      //   dispatch(loginSuccess({ user, token }));
      //   navigate('/dashboard');
      // }

      // TEMPORARY: Bypass auth to navigate directly to dashboard
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: email || 'test@example.com',
      };
      const mockToken = 'mock-token-for-testing';
      dispatch(loginSuccess({ user: mockUser, token: mockToken }));
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Une erreur est survenue';
      setError(message);
      dispatch(loginError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-trello-blue to-trello-blue-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          {isRegister ? 'Créer un compte' : 'Planit'}
        </h1>
        <p className="text-center text-gray-600 mb-6 text-sm">
          {isRegister ? 'Rejoignez Planit' : 'Connectez-vous à votre compte'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required={isRegister}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trello-blue focus:border-transparent outline-none"
                placeholder="Votre nom d'utilisateur"
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
              // required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trello-blue focus:border-transparent outline-none"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              // required
              // minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trello-blue focus:border-transparent outline-none"
              placeholder="••••••"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required={isRegister}
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trello-blue focus:border-transparent outline-none"
                placeholder="••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-trello-blue hover:bg-trello-blue-dark text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading
              ? 'Chargement...'
              : isRegister
              ? "S'inscrire"
              : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          {isRegister ? (
            <>
              Vous avez déjà un compte?{' '}
              <button
                onClick={() => setIsRegister(false)}
                className="text-trello-blue hover:underline font-medium"
              >
                Se connecter
              </button>
            </>
          ) : (
            <>
              Pas encore de compte?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="text-trello-blue hover:underline font-medium"
              >
                S'inscrire
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
