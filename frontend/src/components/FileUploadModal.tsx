// import React, { useRef } from "react";
// import { Card, CardContent, CardFooter } from "./ui/card";
// import { Input } from "./ui/input";
// import { Button } from "./ui/button";
// import { cn } from "../lib/utils";

// interface FileUploadProps {
//   className?: string;
// }

// export function FileUploadModal({className, ...props}:FileUploadProps): JSX.Element {
//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   const handleClick = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   return (
//     <Card className={cn("", className)} {...props}>
//       <CardContent className="p-6 space-y-4">
//         <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col gap-1 p-6 items-center cursor-pointer" onClick={handleClick}>
//           <FileIcon className="w-12 h-12" />
//           <span className="text-xl font-medium text-gray-500">Click to browse</span>
//           <span className="text-xl text-gray-500">Only ZIP Files</span>
//         </div>
//         <div className="space-y-2 text-xl">
//           <label htmlFor="file" className="text-2xl font-medium">
//             File
//           </label>
//           <Input
//             id="file"
//             type="file"
//             ref={fileInputRef}
//             placeholder="File"
//             accept="zip/*"
//             className="text-xl file:text-xl"
//           />
//         </div>
//       </CardContent>
//       <CardFooter>
//         <Button text="Upload" type="submit" className="h-12 rounded-lg px-10 text-xl bg-slate-900 text-white hover:bg-opacity-90 shadow-lg self-end" />
//       </CardFooter>
//     </Card>
//   );
// }

// function FileIcon(props: React.SVGProps<SVGSVGElement>) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
//       <path d="M14 2v4a2 2 0 0 0 2 2h4" />
//     </svg>
//   );
// }

// import React, { useRef, useState } from "react";
// import { Card, CardContent, CardFooter } from "./ui/card";
// import { Input } from "./ui/input";
// import { Button } from "./ui/button";
// import { cn, convertZipToBase64 } from "../lib/utils";
// import { uploadPackageByContent } from "../api";

// interface FileUploadProps {
//   className?: string;
// }

// export function FileUploadModal({ className, ...props }: FileUploadProps): JSX.Element {
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleClick = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   const handleUpload = async () => {
//     setError(null);
//     if (fileInputRef.current?.files?.length) {
//       const file = fileInputRef.current.files[0];
//       if (file.type !== "application/zip") {
//         setError("Only ZIP files are allowed.");
//         return;
//       }
//       try {
//         setLoading(true);
//         const base64Content = await convertZipToBase64(file);
//         const response = await uploadPackageByContent(base64Content, "", false, file.name);
//         console.log("Upload Response:", response);
//       } catch (err) {
//         setError("Failed to upload the package.");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     } else {
//       setError("No file selected.");
//     }
//   };

//   return (
//     <Card className={cn("", className)} {...props}>
//       <CardContent className="p-6 space-y-4">
//         <div
//           className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col gap-1 p-6 items-center cursor-pointer"
//           onClick={handleClick}>
//           <FileIcon className="w-12 h-12" />
//           <span className="text-xl font-medium text-gray-500">Click to browse</span>
//           <span className="text-xl text-gray-500">Only ZIP Files</span>
//         </div>
//         <div className="space-y-2 text-xl">
//           <label htmlFor="file" className="text-2xl font-medium">
//             File
//           </label>
//           <Input
//             id="file"
//             type="file"
//             ref={fileInputRef}
//             placeholder="File"
//             accept=".zip"
//             className="text-xl file:text-xl"
//           />
//         </div>
//         {error && <p className="text-red-500 italic">{error}</p>}
//       </CardContent>
//       <CardFooter>
//         <Button
//           text={loading ? "Uploading..." : "Upload"}
//           type="button"
//           onClick={handleUpload}
//           className="h-12 rounded-lg px-10 text-xl bg-slate-900 text-white hover:bg-opacity-90 shadow-lg self-end"
//           disabled={loading}
//         />
//       </CardFooter>
//     </Card>
//   );
// }

// function FileIcon(props: React.SVGProps<SVGSVGElement>) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round">
//       <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
//       <path d="M14 2v4a2 2 0 0 0 2 2h4" />
//     </svg>
//   );
// }

import React, { useRef, useState } from "react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn, convertZipToBase64 } from "../lib/utils";

interface FileUploadProps {
  className?: string;
  onFileUpload: (base64Content: string) => Promise<JSON>;
}

export function FileUploadModal({ className, onFileUpload, ...props }: FileUploadProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<[string, boolean]>(["", false]);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    setFeedbackMessage(["", false]);
    if (fileInputRef.current?.files?.length) {
      const file = fileInputRef.current.files[0];
      if (file.type !== "application/zip" && file.type !== "application/x-zip-compressed") {
        setFeedbackMessage(["Only ZIP files are allowed.", false]);
        return;
      }
      try {
        setLoading(true);
        const base64Content = await convertZipToBase64(file);
        const response = await onFileUpload(base64Content);
        if (response) {
          setFeedbackMessage(["Uploaded Successfully", true]);
        } else {
          setFeedbackMessage(["Failed to upload the package.", false]);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setFeedbackMessage(["An unexpected error occurred.", false]);
      } finally {
        setLoading(false);
      }
    } else {
      setFeedbackMessage(["No file selected.", false]);
    }
  };

  return (
    <Card className={cn("", className)} {...props}>
      <CardContent className="p-6 space-y-4">
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col gap-1 p-6 items-center cursor-pointer"
          onClick={handleClick}
        >
          <FileIcon className="w-12 h-12" />
          <span className="text-xl font-medium text-gray-500">Click to browse</span>
          <span className="text-xl text-gray-500">Only ZIP Files</span>
        </div>
        <div className="space-y-2 text-xl">
          <label htmlFor="file" className="text-2xl font-medium">
            File
          </label>
          <Input
            id="file"
            type="file"
            ref={fileInputRef}
            placeholder="File"
            accept=".zip"
            className="text-xl file:text-xl"
          />
        </div>
        {feedbackMessage[0] !== "" && <p className={`italic ${feedbackMessage[1] ? "text-green-500" : "text-red-500"}`}>{feedbackMessage[0]}</p>}
      </CardContent>
      <CardFooter>
        <Button
          text={loading ? "Uploading..." : "Upload"}
          type="button"
          onClick={handleUpload}
          className="h-12 rounded-lg px-10 text-xl bg-slate-900 text-white hover:bg-opacity-90 shadow-lg self-end"
          disabled={loading}
        />
      </CardFooter>
    </Card>
  );
}

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}
