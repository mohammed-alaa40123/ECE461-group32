// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { authenticateUser } from '../api'; // Adjust path as needed
// import Loading from '../components/ui/loading';

// type SignupProps = {
//   onSignupSuccess: () => void;
// };

// const Signup: React.FC<SignupProps> = ({ onSignupSuccess }) => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [isAdministrator, setIsAdministrator] = useState(false); // Assuming option to set admin status
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);

//   const handleSignup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     if (password !== confirmPassword) {
//       setError('Passwords do not match');
//       return;
//     }

//     try {
//       setLoading(true);
//       const data = await authenticateUser(username, password, isAdministrator);
//       if (data && data.token) {
//         localStorage.setItem('authToken', data.token); // Save token
//         onSignupSuccess();
//         alert('Signup successful! Please log in.');
//         navigate('/login'); // Redirect to login
//       } else {
//         setError('Signup failed. Please try again.');
//       }
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         setError(err.message); // Safely access the error message if it’s an instance of Error
//     } else {
//         setError('An unexpected error occurred'); // Fallback message if err is not of type Error
//     }
//     } finally {
//     setLoading(false);
//   }
//   };

//   if (loading) {
//     return <Loading />; // Show the spinner while loading is true
//   }

//   return (
//     <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center text-3xl">
//       <h2 className="text-3xl font-bold text-white mb-6">Sign Up</h2>
//       <button
//         onClick={() => navigate('/')}
//         className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded mb-4"
//       >
//         Back
//       </button>
//       <form onSubmit={handleSignup} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
//         <div className="mb-4">
//           <label className="block text-gray-700 font-bold mb-2" htmlFor="username">Username</label>
//           <input
//             id="username"
//             type="text"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             required
//             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700 font-bold mb-2" htmlFor="password">Password</label>
//           <input
//             id="password"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//           />
//         </div>
//         <div className="mb-6">
//           <label className="block text-gray-700 font-bold mb-2" htmlFor="confirmPassword">Confirm Password</label>
//           <input
//             id="confirmPassword"
//             type="password"
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             required
//             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-gray-700 font-bold mb-2">
//             <input
//               className="scale-[2] mr-4"
//               type="checkbox"
//               checked={isAdministrator}
//               onChange={(e) => setIsAdministrator(e.target.checked)}
//             />
//             Admin User
//           </label>
//         </div>
//         {error && <p className="text-red-500 italic mb-4">{error}</p>}
//         <div className="flex items-center justify-between">
//           <button
//             type="submit"
//             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//           >
//             Sign Up
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default Signup;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api"; // Adjust path as needed
import Loading from "../components/ui/loading";

const Signup: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdministrator, setIsAdministrator] = useState(false); // Assuming option to set admin status
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

      

    try {
      setLoading(true);
      const data = await registerUser(username, password, isAdministrator);
      if (data) {
        alert("Signup successful! Please log in.");
        navigate("/login"); // Redirect to login
      } else {
        setError("Signup failed. Please try again.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message); // Safely access the error message if it’s an instance of Error
      } else {
        setError("An unexpected error occurred"); // Fallback message if err is not of type Error
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />; // Show the spinner while loading is true
  }

  return (
    <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center text-3xl">
      <h2 className="text-3xl font-bold text-white mb-6">Sign Up</h2>
      <button
        onClick={() => navigate("/")}
        className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded mb-4">
        Back
      </button>
      <form onSubmit={handleSignup} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            <input
              className="scale-[2] mr-4"
              type="checkbox"
              checked={isAdministrator}
              onChange={(e) => setIsAdministrator(e.target.checked)}
            />
            Admin User
          </label>
        </div>
        {error && <p className="text-red-500 italic mb-4">{error}</p>}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
};

export default Signup;
