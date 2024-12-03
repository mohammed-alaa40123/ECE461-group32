// src/models/PackageCost.ts

export interface PackageCostDetail {
    standaloneCost?: number;
    totalCost: number;
  }
  
  export interface PackageCost {
    [packageId: string]: PackageCostDetail;
  }
  