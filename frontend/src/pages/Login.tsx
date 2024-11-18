import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateUser } from '../api'; // Make sure the path matches your file structure
import Loading from '../components/ui/loading';

type LoginProps = {
  onLoginSuccess: () => void;
};

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      // Use the authenticateUser API function to log in the user
      const data = await authenticateUser(username, password, false); // Assuming false for `isAdministrator`
      // console.log(data);
      // console.log(data.token);
      if (data && data.token) {
        localStorage.setItem('authToken', data.token); // Save the token for authenticated requests
        onLoginSuccess(); // Update parent state to reflect login status
        navigate('/'); // Redirect to the home page
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message); // Safely access the error message if it’s an instance of Error
    } else {
        setError('An unexpected error occurred'); // Fallback message if err is not of type Error
    }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />; // Show the spinner while loading is true
  }

  return (
    <div className="text-3xl min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center">
      <h2 className="font-bold text-white mb-6">Login</h2>
      <button
        onClick={() => navigate('/')}
        className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Back
      </button>
      <form onSubmit={handleLogin} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        {error && <p className="text-red-500 italic mb-4">{error}</p>}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
