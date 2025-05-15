export type BillingPeriod = "monthly" | "yearly";

export type PricingTier = {
  id: string;
  name: string;
  description: string; // We'll keep this in the type definition but not use it in the card
  price: {
    monthly: number | null;
    yearly: number | null;
  };
  features: string[];
  buttonText: string;
  popular?: boolean;
  buildingLimit: number;
  monthlyExportLimit: number;
  customLogo: boolean;
  qrCode: boolean;
  templates: "none" | "single" | "unlimited";
  organizationSupport: boolean;
  reviewFeatures: boolean;
  userInvites: "none" | "limited" | "unlimited";
  statistics: boolean;
  support: "none" | "email" | "priority" | "dedicated";
  trial?: { days: number };
  color: string;
};

export const pricingTiers: PricingTier[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Create evacuation plans with limited functionality",
    price: {
      monthly: 9,
      yearly: 90,
    },
    buildingLimit: 5,
    monthlyExportLimit: 3,
    features: [
      "Create evacuation plans",
      "Export with Firemap logo",
      "3 exports/month",
      "5 buildings",
      "QR code",
      "14-day trial upon registration"
    ],
    buttonText: "Start free trial",
    popular: false,
    customLogo: false,
    qrCode: true,
    templates: "none",
    organizationSupport: false,
    reviewFeatures: false,
    userInvites: "none",
    statistics: false,
    support: "none",
    trial: { days: 14 },
    color: "green"
  },
  {
    id: "pro",
    name: "Pro",
    description: "For small businesses or sole proprietors",
    price: {
      monthly: 49,
      yearly: 490,
    },
    buildingLimit: 25,
    monthlyExportLimit: 15,
    features: [
      "Everything in Basic",
      "15 exports/month",
      "Up to 25 buildings",
      "Custom logo",
      "Custom template",
      "Email support"
    ],
    buttonText: "Subscribe",
    popular: true,
    customLogo: true,
    qrCode: true,
    templates: "single",
    organizationSupport: false,
    reviewFeatures: false,
    userInvites: "none",
    statistics: false,
    support: "email",
    color: "blue"
  },
  {
    id: "team",
    name: "Team",
    description: "Small fire protection companies, housing companies, etc.",
    price: {
      monthly: 149,
      yearly: 1490,
    },
    buildingLimit: 100,
    monthlyExportLimit: 100,
    features: [
      "Everything in Pro",
      "100 exports/month",
      "Invite unlimited users",
      "Review functionality",
      "Up to 100 buildings",
      "Create organizations",
      "Unlimited templates",
      "Statistics / usage reports"
    ],
    buttonText: "Subscribe",
    customLogo: true,
    qrCode: true,
    templates: "unlimited",
    organizationSupport: true,
    reviewFeatures: true,
    userInvites: "unlimited",
    statistics: true,
    support: "priority",
    color: "yellow"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Larger companies, municipalities, national actors",
    price: {
      monthly: null,
      yearly: null,
    },
    buildingLimit: 500,
    monthlyExportLimit: 500,
    features: [
      "Customized solution",
      "Contact us for a custom quote"
    ],
    buttonText: "Contact us",
    customLogo: true,
    qrCode: true,
    templates: "unlimited",
    organizationSupport: true,
    reviewFeatures: true,
    userInvites: "unlimited",
    statistics: true,
    support: "dedicated",
    color: "red"
  }
];
