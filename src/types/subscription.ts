
export interface ResourceUsage {
  used: number;
  total: number | "unlimited";
}

export interface ResourceStatistics {
  buildings: ResourceUsage;
  organizations: ResourceUsage;
  templates: ResourceUsage;
  evacuationPlans: ResourceUsage;
}

export interface BuildingUsage {
  total: number;
  monthly: number;
  limits: {
    total: number | "unlimited";
    monthly: number | "unlimited";
  };
}

export interface SubscriptionInfo {
  tier: string;
  status: string;
  isTrial: boolean;
  endDate?: string;
}
