import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function convertZipToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      } else {
        reject(new Error("Unable to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

export function downloadFile(base64String: string, fileName: string): {url: string, fileName: string} {
  // Convert Base64 to a Blob
  const byteString = atob(base64String);
  const byteArray = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([byteArray], { type: "application/zip" });
  const url = URL.createObjectURL(blob);

  return {url, fileName};
}
