import React from 'react'
import './App.css'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { FileUploadModal } from "./components/FileUploadModal"
import Form from './components/Form'

export default function App(): JSX.Element {
  const tabs: string[] = ["Upload a package", "Download a package", "Rate a package"]
  return (
    <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col">
      {/* <Logo /> */}
      {/* <NavBar /> */}
      <h1 className="flex justify-center items-center text-3xl font-bold text-white" role="heading">
        ECE 461 Project
      </h1>
      
      <main className="my-9 flex justify-center gap-14 flex-grow text-xl">
        <Tabs defaultValue="account">
          <TabsList>
            {tabs.map((tab) => <TabsTrigger value={tab.toLowerCase()}>{tab}</TabsTrigger>)}
          </TabsList>
          {tabs.map((tab) => <TabsContent value={tab.toLowerCase()}>
              {tab === "Upload a package" && <FileUploadModal />}
              {tab === "Download a package" && <Form />}
              {tab === "Rate a package" && <Form />}
          </TabsContent>)}
          
        </Tabs>
      </main>
    </div>
  )
}
