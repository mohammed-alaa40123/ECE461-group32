import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Upload from "../components/Upload";
import Delete from "../components/Delete";
import Download from "../components/Download";
import Update from "../components/Update";
import Rate from "../components/Rate";
import Cost from "../components/Cost";
import { Button } from "../components/ui/button";

const Home: React.FC<{ isLoggedIn: boolean; onLogout: () => void }> = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const tabs: string[] = [
    "Upload a package",
    "Download a package",
    "Delete a package",
    "Update a package",
    "Package rate",
    "Package cost"
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].toLowerCase()); // Use the first tab as default

  return (
    <div className="text-3xl min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center">
      <h1 className="text-6xl font-bold text-white mb-6">ECE 461 Project</h1>
      {isLoggedIn ? (
        <>
          <Button
            text="Logout"
            className="bg-red-500 text-white p-3 rounded mb-6"
            onClick={() => {
              localStorage.removeItem("authToken");
              onLogout();
              navigate("/");
            }}
          />
          <div className="flex items-center justify-center gap-10 rounded">
            {tabs.map((tab) => (
              <div
                role="tab"
                key={tab}
                className={`bg-white h-fit px-2 py-1 rounded cursor-pointer whitespace-nowrap ${tab.toLowerCase() === activeTab ? "bg-opacity-100" : "bg-opacity-50"}`}
                onClick={() => setActiveTab(tab.toLowerCase())}>
                {tab}
              </div>
            ))}
          </div>
          <div className="mt-10">
            {activeTab === "upload a package" && <Upload />}
            {activeTab === "download a package" && <Download />}
            {activeTab === "delete a package" && <Delete />}
            {activeTab === "update a package" && <Update />}
            {activeTab === "package rate" && <Rate />}
            {activeTab === "package cost" && <Cost />}
          </div>
        </>
      ) : (
        <div className="flex gap-3">
          <Button text="Login" className="bg-blue-500 text-white p-3 rounded mr-4" onClick={() => navigate("/login")} />
          <Button text="Sign Up" className="bg-green-500 text-white p-3 rounded" onClick={() => navigate("/signup")} />
        </div>
      )}
    </div>
  );
};

export default Home;
