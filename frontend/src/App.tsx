import './App.css'
// import Logo from './components/Logo'
// import NavBar from './components/NavBar'
// import PackageActionButton from './components/PackageActionButton'
// import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploadModal } from "@/components/component/FileUploadModal"
import Form from './components/Form'

export default function App(): JSX.Element {
  const tabs: string[] = ["Upload a package", "Download a package", "Rate a package"]
  return (
    <div className="min-h-screen bg-gray-900 py-7 px-60 flex flex-col">
      {/* <Logo /> */}
      {/* <NavBar /> */}
      <header className="flex justify-center items-center text-3xl font-bold text-white ">
        <h1>ECE 461 Project</h1>
      </header>
      
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
