// backend/models/Package.ts

export interface PackageMetadata {
    Name: string;
    Version: string;
    ID: string;
  }
  
  export interface PackageData {
    Content?: string; // Base64-encoded zip file
    URL?: string;
    debloat?: boolean;
    JSProgram?: string;
  }
  
  export interface Package {
    metadata: PackageMetadata;
    data: PackageData;
  }
  