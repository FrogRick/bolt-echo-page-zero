
export interface ResourceUsage {
  used: number;
  total: number;
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
    total: number;
    monthly: number;
  };
}
