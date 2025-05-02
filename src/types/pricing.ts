
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
  buildingLimit: number;
  monthlyBuildingLimit: number;
  customLogo: boolean;
  qrCode: boolean;
  trial?: { days: number };
};

export const pricingTiers: PricingTier[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Perfect for small businesses and property managers",
    price: {
      monthly: 9,
      yearly: 89,
    },
    buildingLimit: 10,
    monthlyBuildingLimit: 3,
    features: [
      "Up to 10 buildings",
      "Create 3 buildings per month",
      "Download as PDF",
      "Automatic wall detection",
      "Firemap branding included",
      "14-day free trial"
    ],
    buttonText: "Start free trial",
    popular: true,
    customLogo: false,
    qrCode: false,
    trial: { days: 14 }
  },
  {
    id: "premium",
    name: "Premium",
    description: "For businesses managing multiple properties",
    price: {
      monthly: 49,
      yearly: 490,
    },
    buildingLimit: 50,
    monthlyBuildingLimit: 10,
    features: [
      "Up to 50 buildings",
      "Create 10 buildings per month",
      "Custom logo on exports",
      "QR code generation"
    ],
    buttonText: "Subscribe",
    customLogo: true,
    qrCode: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations with extensive building portfolios",
    price: {
      monthly: 290,
      yearly: 2900,
    },
    buildingLimit: 300,
    monthlyBuildingLimit: 50,
    features: [
      "Up to 300 buildings",
      "Create 50 buildings per month",
      "Custom logo on exports",
      "QR code generation",
      "Multiple user accounts (coming soon)"
    ],
    buttonText: "Subscribe",
    customLogo: true,
    qrCode: true
  }
];
