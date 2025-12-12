import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-trello-blue via-blue-500 to-blue-600">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Planit</h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-white text-trello-blue font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Plan your success, one board at a time
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Planit is a simple and powerful Kanban application to manage your
          projects and teams. Inspired by Trello, built with the best modern
          technologies.
        </p>

        <div className="space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-white text-trello-blue font-semibold rounded-lg hover:bg-gray-100 transition inline-block"
          >
            Get Started Free
          </button>
          <button
            onClick={() => navigate('/login?tab=register')}
            className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-trello-blue transition inline-block"
          >
            Sign Up
          </button>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Intuitive Boards
            </h3>
            <p className="text-blue-100">
              Organize your ideas with Kanban-style boards, easy to use and
              understand.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Smooth Management
            </h3>
            <p className="text-blue-100">
              Drag and drop your cards between lists for effortless project
              management.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Production-ready
            </h3>
            <p className="text-blue-100">
              Built with React, Node.js, and MongoDB for a reliable and fast
              experience.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-20">
          <h3 className="text-2xl font-semibold text-white mb-8">Built with</h3>
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
