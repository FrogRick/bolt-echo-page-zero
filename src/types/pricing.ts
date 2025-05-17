
export type BillingPeriod = "monthly" | "yearly";

export type PricingTier = {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number | null;
    yearly: number | null;
  };
  features: string[];
  buttonText: string;
  popular?: boolean;
  
  // Limits
  buildingLimit: number | "unlimited";
  evacuationPlanLimit: number;
  organizationLimit: number | "unlimited";
  templateLimit: number;
  inviteTeamMembers: boolean;
  
  trial?: { days: number };
  color: string;
};

export const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    description: "Limited functionality for individual use",
    price: {
      monthly: 0,
      yearly: 0,
    },
    buildingLimit: 1,
    evacuationPlanLimit: 1,
    organizationLimit: 0,
    templateLimit: 0,
    inviteTeamMembers: false,
    features: [
      "1 evacuation plan",
      "1 building",
      "Limited features"
    ],
    buttonText: "Current Plan",
    color: "gray"
  },
  {
    id: "basic",
    name: "Basic",
    description: "Essential features for small projects",
    price: {
      monthly: 9.99,
      yearly: 99.99,
    },
    buildingLimit: 3,
    evacuationPlanLimit: 5,
    organizationLimit: 1,
    templateLimit: 1,
    inviteTeamMembers: false,
    features: [
      "5 evacuation plans",
      "3 buildings",
      "1 organization",
      "1 template",
      "14-day trial upon registration"
    ],
    buttonText: "Start free trial",
    trial: { days: 14 },
    color: "green"
  },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced features for professionals",
    price: {
      monthly: 29.99,
      yearly: 299.99,
    },
    buildingLimit: "unlimited",
    evacuationPlanLimit: 100,
    organizationLimit: "unlimited",
    templateLimit: 10,
    inviteTeamMembers: false,
    features: [
      "100 evacuation plans",
      "Unlimited buildings",
      "Unlimited organizations",
      "10 templates",
      "Priority support"
    ],
    buttonText: "Subscribe",
    popular: true,
    color: "blue"
  },
  {
    id: "team",
    name: "Team",
    description: "Collaborative features for teams",
    price: {
      monthly: 49.99,
      yearly: 499.99,
    },
    buildingLimit: "unlimited",
    evacuationPlanLimit: 500,
    organizationLimit: "unlimited",
    templateLimit: 25,
    inviteTeamMembers: true,
    features: [
      "500 evacuation plans",
      "Unlimited buildings",
      "Unlimited organizations",
      "25 templates",
      "Invite team members",
      "Advanced analytics",
      "Dedicated support"
    ],
    buttonText: "Subscribe",
    color: "purple"
  }
];
