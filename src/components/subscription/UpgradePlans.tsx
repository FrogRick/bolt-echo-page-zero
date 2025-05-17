
import React from "react";
import { PricingTier, BillingPeriod } from "@/types/pricing";
import PricingHeader from "@/components/pricing/PricingHeader";
import PricingTierCard from "@/components/pricing/PricingTierCard";

interface UpgradePlansProps {
  pricingTiers: PricingTier[];
  billingPeriod: BillingPeriod;
  toggleBillingPeriod: () => void;
  loadingTier: string | null;
  subscriptionTier: string;
  calculateSavings: (monthlyPrice: number, yearlyPrice: number) => number;
  handleSubscribe: (tier: PricingTier) => void;
}

const UpgradePlans: React.FC<UpgradePlansProps> = ({
  pricingTiers,
  billingPeriod,
  toggleBillingPeriod,
  loadingTier,
  subscriptionTier,
  calculateSavings,
  handleSubscribe
}) => {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Upgrade Your Plan</h2>
      <PricingHeader 
        billingPeriod={billingPeriod} 
        toggleBillingPeriod={toggleBillingPeriod} 
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {pricingTiers
          .filter(tier => tier.id !== subscriptionTier)
          .map((tier) => (
            <PricingTierCard
              key={tier.id}
              tier={tier}
              billingPeriod={billingPeriod}
              loadingTier={loadingTier}
              subscriptionTier={subscriptionTier}
              calculateSavings={calculateSavings}
              handleSubscribe={handleSubscribe}
            />
          ))}
      </div>
    </div>
  );
};

export default UpgradePlans;
