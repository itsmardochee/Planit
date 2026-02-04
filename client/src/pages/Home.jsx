import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/LanguageSelector';

const Home = () => {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-trello-blue via-blue-500 to-blue-600 dark:from-blue-900 dark:via-blue-950 dark:to-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Planit</h1>
        <div className="flex items-center space-x-4">
          <LanguageSelector />
          <DarkModeToggle />
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-white dark:bg-gray-800 text-trello-blue dark:text-blue-400 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {t('home:nav.login')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          {t('home:hero.title')}
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          {t('home:hero.subtitle')}
        </p>

        <div className="space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-white dark:bg-gray-800 text-trello-blue dark:text-blue-400 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition inline-block"
          >
            {t('home:hero.getStarted')}
          </button>
          <button
            onClick={() => navigate('/login?tab=register')}
            className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white dark:hover:bg-gray-800 hover:text-trello-blue dark:hover:text-blue-400 transition inline-block"
          >
            {t('home:hero.signUp')}
          </button>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('home:features.boards.title')}
            </h3>
            <p className="text-blue-100">
              {t('home:features.boards.description')}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('home:features.management.title')}
            </h3>
            <p className="text-blue-100">
              {t('home:features.management.description')}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('home:features.production.title')}
            </h3>
            <p className="text-blue-100">
              {t('home:features.production.description')}
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-20">
          <h3 className="text-2xl font-semibold text-white mb-8">
            {t('home:tech.title')}
          </h3>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="bg-white bg-opacity-10 px-4 py-2 rounded-lg text-white font-semibold">
              React
            </div>
            <div className="bg-white bg-opacity-10 px-4 py-2 rounded-lg text-white font-semibold">
              Node.js
            </div>
            <div className="bg-white bg-opacity-10 px-4 py-2 rounded-lg text-white font-semibold">
              MongoDB
            </div>
            <div className="bg-white bg-opacity-10 px-4 py-2 rounded-lg text-white font-semibold">
              Tailwind CSS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
