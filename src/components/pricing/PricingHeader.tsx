
import BillingToggle from "./BillingToggle";
import { BillingPeriod } from "@/types/pricing";

interface PricingHeaderProps {
  billingPeriod: BillingPeriod;
  toggleBillingPeriod: () => void;
}

const PricingHeader = ({ billingPeriod, toggleBillingPeriod }: PricingHeaderProps) => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Choose the plan that's right for you. All plans include our core evacuation planning features.
      </p>

      <BillingToggle 
        billingPeriod={billingPeriod}
        toggleBillingPeriod={toggleBillingPeriod}
      />
    </div>
  );
};

export default PricingHeader;
