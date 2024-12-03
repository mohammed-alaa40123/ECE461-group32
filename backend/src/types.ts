// src/types.ts

export interface User {
    id: number;
    name: string;
    isAdmin: boolean;
  }
  
  export interface UserAuthenticationInfo {
    user_id: number;
    password: string;
  }
  
  export interface AuthenticatedUser {
    sub: number;
    name: string;
    isAdmin: boolean;
    iat: number;
    exp: number;
  }
  

  interface PackageMetadata {
    Name: string;
    Version: string;
    ID: string;
  }
  
  interface PackageData {
    Content?: string; // Base64-encoded zip file
    URL?: string;     // Package URL
    debloat?: boolean;
    JSProgram?: string;
  }
  
  interface Package {
    metadata: PackageMetadata;
    data: PackageData;
  }