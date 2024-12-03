// src/models/User.ts

export interface User {
    id: number;
    name: string;
    isAdmin: boolean;
    password_hash: string;
  }
  
  export interface AuthenticationRequest {
    User: {
      name: string;
      isAdmin: boolean;
    };
    Secret: {
      password: string;
    };
  }
  
  export interface AuthenticationToken {
    token: string;
  }
  