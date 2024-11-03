import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Upload from "./components/Upload";
import Delete from "./components/Delete";
import Download from "./components/Download";
import Update from "./components/Update";
import Rate from "./components/Rate";
import Cost from "./components/Cost";
import Login from "./pages/Login";
import Signup from './pages/Signup';
import { Button } from './components/ui/button';

const Home: React.FC<{ isLoggedIn: boolean; onLogout: () => void }> = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const tabs: string[] = ["Upload a package", "Download a package", "Delete a package", "Update a package", "Package rate", "Package cost"];
  const [activeTab, setActiveTab] = useState(tabs[0].toLowerCase());

  return (
    <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-white mb-6">ECE 461 Project</h1>
      {isLoggedIn ? (
        <>
          <Button
            text="Logout"
            className="bg-red-500 text-white p-3 rounded mb-6"
            onClick={() => {
              localStorage.removeItem('authToken');
              onLogout();
              navigate('/');
            }}
          />
          <div className="text-3xl flex items-center justify-center gap-10 rounded">
            {tabs.map((tab) => (
              <div
                role="tab"
                key={tab}
                className={`bg-white h-fit px-2 py-1 rounded cursor-pointer whitespace-nowrap ${tab.toLowerCase() === activeTab ? "bg-opacity-100" : "bg-opacity-50"}`}
                onClick={() => setActiveTab(tab.toLowerCase())}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className="mt-10">
            {(activeTab === "upload a package") && <Upload />}
            {(activeTab === "download a package") && <Download />}
            {(activeTab === "delete a package") && <Delete />}
            {(activeTab === "update a package") && <Update />}
            {(activeTab === "package rate") && <Rate />}
            {(activeTab === "package cost") && <Cost />}
          </div>
        </>
      ) : (
        <>
          <Button
            text="Login"
            className="bg-blue-500 text-white p-3 rounded mr-4"
            onClick={() => navigate('/login')}
          />
          <Button
            text="Sign Up"
            className="bg-green-500 text-white p-3 rounded"
            onClick={() => navigate('/signup')}
          />
        </>
      )}
    </div>
  );
};

function App(): JSX.Element {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />} />
        <Route path="/login" element={!isLoggedIn ? <Login onLoginSuccess={() => setIsLoggedIn(true)} /> : <Navigate to="/" />} />
        <Route path="/signup" element={!isLoggedIn ? <Signup onSignupSuccess={() => setIsLoggedIn(false)} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
