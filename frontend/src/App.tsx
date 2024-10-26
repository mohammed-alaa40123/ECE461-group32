import React, { useState } from 'react';
import './App.css';
import { FileUploadModal } from "./components/FileUploadModal";
import Form from './components/Form';
import { cn } from "./lib/utils";

export default function App(): JSX.Element {
  const tabs: string[] = ["Upload a package", "Download a package", "Rate a package"];
  const [activeTab, setActiveTab] = useState(tabs[0].toLowerCase()); // Use the first tab as default

  return (
    <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col items-center">
      <h1 className="mx-auto text-3xl font-bold text-white" role="heading">
        ECE 461 Project
      </h1>
      <main className="mt-9 flex flex-col items-center gap-10 flex-grow text-xl w-fit">
        <div className="flex gap-10">
          {tabs.map((tab) => <div role="tab" className={cn("bg-white h-fit px-2 py-1 rounded cursor-pointer", tab.toLowerCase() === activeTab ? "bg-opacity-100" : "bg-opacity-50")} onClick={() => setActiveTab(tab.toLowerCase())}>{tab}</div>)}
        </div>
        <div className="w-full">
          {activeTab === "upload a package" && <FileUploadModal />}
          {(activeTab === "download a package" || activeTab === "rate a package") && <Form />}
        </div>
      </main>
    </div>
  );
}
