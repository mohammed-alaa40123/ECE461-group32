// src/interfaces/Package.ts

export interface Package {
  metadata: PackageMetadata;
  data: PackageData;
}

export interface PackageMetadata {
  Name: PackageName;
  Version: string; // Example: "1.2.3"
  ID: PackageID;
  Owner?: string;
}

export interface PackageData {
  Name?:string
  Content?: string; // Base64 encoded string
  URL?: string;
  debloat?: boolean;
  JSProgram?: string;
}

export interface User {
  name: string;
  isAdmin: boolean;
}

export interface UserAuthenticationInfo {
  password: string;
}

export type PackageID = string; // Pattern: '^[a-zA-Z0-9\-]+$'

export interface PackageCost {
  [packageId: string]: {
    standaloneCost?: number;
    totalCost: number;
  };
}

export interface PackageRating {
  RampUp: number;
  Correctness: number;
  BusFactor: number;
  ResponsiveMaintainer: number;
  LicenseScore: number;
  GoodPinningPractice: number;
  PullRequest: number;
  NetScore: number;
  RampUpLatency: number;
  CorrectnessLatency: number;
  BusFactorLatency: number;
  ResponsiveMaintainerLatency: number;
  LicenseScoreLatency: number;
  GoodPinningPracticeLatency: number;
  PullRequestLatency: number;
  NetScoreLatency: number;
}

export interface PackageHistoryEntry {
  User: User;
  Date: string; // ISO-8601 Datetime standard in UTC format
  PackageMetadata: PackageMetadata;
  Action: 'CREATE' | 'UPDATE' | 'DOWNLOAD' | 'RATE';
}

export type PackageName = string;

export type AuthenticationToken = string;

export interface AuthenticationRequest {
  User: User;
  Secret: UserAuthenticationInfo;
}

export type SemverRange = string; // Examples: "1.2.3", "^1.2.3", "~1.2.0"

export interface PackageQuery {
  Version?: SemverRange;
  Name: PackageName;
}

export type EnumerateOffset = string; // Example: "1"

export interface PackageRegEx {
  RegEx: string;
}
