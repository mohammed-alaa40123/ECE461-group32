// src/models/PackageHistoryEntry.ts

export interface PackageHistoryEntry {
    User: {
      name: string;
      isAdmin: boolean;
    };
    Date: string; // ISO-8601 format
    PackageMetadata: {
      Name: string;
      Version: string;
      ID: string;
    };
    Action: 'CREATE' | 'UPDATE' | 'DOWNLOAD' | 'RATE';
  }
  