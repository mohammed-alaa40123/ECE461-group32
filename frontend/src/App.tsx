import React, { useState, useEffect } from 'react';
import './App.css';
import Upload from "./components/Upload";
import Delete from "./components/Delete";
import Download from "./components/Download";
import Update from "./components/Update";
import Rate from "./components/Rate";
import Cost from "./components/Cost";
import Login from "./pages/Login";
import Signup from './pages/Signup';
import { cn } from "./lib/utils";
import { Button } from './components/ui/button';

export default function App(): JSX.Element {
  const tabs: string[] = ["Upload a package", "Download a package", "Delete a package", "Update a package", "Package rate", "Package cost"];
  const pages: string[] = ["Signup", "Login"];
  const [activeTab, setActiveTab] = useState(tabs[0].toLowerCase()); // Use the first tab as default
  const [showSignup, setShowSignup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [main, setMain] = useState(true);

  useEffect(() => {
    // Check if there's an auth token in localStorage to determine login state
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  if (showSignup) {
    return <Signup onSignupSuccess={() => setShowSignup(false)} />; // Return to login page after signup
  }

  if (isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />; // Pass callback to handle successful login
  }

  return (
    <>
    <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center relative">
      <Button 
        text="Home"
        type='button'
        className="bg-white p-3 absolute rounded left-16"
        onClick={() => {
          setMain(true);
        }}
      />
      <h1 className="mx-auto text-3xl font-bold text-white" role="heading">
          ECE 461 Project
      </h1>
      {main &&
      <div className="text-3xl flex items-center justify-center gap-10 rounded">
        {pages.map((page) => (
          <Button 
            key={page}
            text={page} 
            type="button" 
            className="bg-blue-500 rounded p-3 text-white mt-10"
            onClick={() => {
              if (page === "Login") {
                setIsLoggedIn(true);
                setMain(false);
              }
              else if (page === "Signup") {
                setShowSignup(true);
                setMain(false);
              }
            } }
          />
      ))}
      </div>
    }
    </div>
    {!isLoggedIn && showSignup &&
      <Signup onSignupSuccess={() => setShowSignup(true)} />
    }
    {!isLoggedIn && !showSignup &&
      <Login onLoginSuccess={() => setIsLoggedIn(true)} />
    }
    {(isLoggedIn && showSignup) &&
      <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center">
      <h1 className="mx-auto text-3xl font-bold text-white" role="heading">
        ECE 461 Project
      </h1>
      <main className="mt-9 flex flex-col items-center gap-10 flex-grow w-fit text-3xl">
        <div className="flex justify-center gap-10 flex-wrap">
          {tabs.map((tab) => (
            <div
              role="tab"
              key={tab}
              className={cn(
                "bg-white h-fit px-2 py-1 rounded cursor-pointer whitespace-nowrap",
                tab.toLowerCase() === activeTab ? "bg-opacity-100" : "bg-opacity-50"
              )}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
            </div>
          ))}
        </div>
        <div>
          {(activeTab === "upload a package") && <Upload />}
          {(activeTab === "download a package") && <Download />}
          {(activeTab === "package rate") && <Rate />}
          {(activeTab === "update a package") && <Update />}
          {(activeTab === "delete a package") && <Delete />}
          {(activeTab === "package cost") && <Cost />}
        </div>
      </main>
    </div>}
    </>
  );
}
