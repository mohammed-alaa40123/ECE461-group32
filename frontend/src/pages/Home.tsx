import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Upload from "../components/Upload";
import Reset from "../components/Reset";
import GetPackages from "../components/GetPackages";
import Update from "../components/Update";
import Rate from "../components/Rate";
import Cost from "../components/Cost";
import { Button } from "../components/ui/button";
import Tracks from "../components/Tracks";
import GetPackage from "../components/GetPackage";
import AddUser from "../components/AddUser";
import AddGroup from "../components/AddGroup";
import DeleteGroup from "../components/DeleteGroup";

const Home: React.FC<{ isLoggedIn: boolean; onLogout: () => void }> = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const tabs: string[] = [
    "Upload a package",
    "Get packages by query",
    "Update a package",
    "Package rate",
    "Package cost",
    "Reset the rigestiry",
    "Get a package",
    "Add a user",
    "Add a group",
    "Delete a group",
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].toLowerCase()); // Use the first tab as default

  return (
    <div className="text-3xl min-h-screen bg-gray-900 py-7 px-60 text-center flex flex-col gap-16">
      <h1 className="text-6xl font-bold text-white mb-9">ECE 461 Project</h1>
        {isLoggedIn ? (
          <div>
            <Button
              text="Logout"
              className="bg-red-500 text-white p-3 rounded mb-6"
              onClick={() => {
                localStorage.removeItem("authToken");
                onLogout();
                navigate("/");
              }}
            />
            <div className="flex flex-wrap items-center justify-center gap-10 rounded">
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
            <div className="mt-10 mx-auto">
              {activeTab === "upload a package" && <Upload />}
              {activeTab === "get packages by query" && <GetPackages />}
              {activeTab === "reset the rigestiry" && <Reset />}
              {activeTab === "update a package" && <Update />}
              {activeTab === "package rate" && <Rate />}
              {activeTab === "package cost" && <Cost />}
              {activeTab === "get a package" && <GetPackage />}
              {activeTab === "add a user" && <AddUser />}
              {activeTab === "add a group" && <AddGroup />}
              {activeTab === "delete a group" && <DeleteGroup />}
            </div>
          </div>
        ) : (
          <main className="flex flex-col items-center">
              <Button
                text="Login"
                className="bg-blue-500 text-white p-3 rounded mr-4"
                onClick={() => navigate("/login")}
              />
              <Tracks />
              {/* <Button
                text="Sign Up"
                className="bg-green-500 text-white p-3 rounded"
                onClick={() => navigate("/signup")}
              /> */}
          </main>
        )}
    </div>
  );
};

export default Home;
