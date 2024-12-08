// src/types.ts

export type User= {
    id: number;
    name: string;
    isAdmin: boolean;
  }
  
  export type UserAuthenticationInfo= {
    user_id: number;
    password: string;
  }
  
  export type AuthenticatedUser= {
    sub: number;
    name: string;
    isAdmin: boolean;
    iat: number;
    exp: number;
  }
  

  type PackageMetadata= {
    Name: string;
    Version: string;
    ID: string;
  }
  
  type PackageData= {
    Content?: string; // Base64-encoded zip file
    URL?: string;     // Package URL
    debloat?: boolean;
    JSProgram?: string;
  }
  
  export type Package ={
    metadata: PackageMetadata;
    data: PackageData;
  }