import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Loading from "./components/ui/loading";

function App(): JSX.Element {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return <Loading />;
  }

  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />} />
          <Route
            path="/login"
            element={!isLoggedIn ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />}
          />
          <Route path="/signup" element={!isLoggedIn ? <Signup /> : <Navigate to="/" />} />
        </Routes>
      </Router>
  );
}

export default App;
