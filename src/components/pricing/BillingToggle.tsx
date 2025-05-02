
import { Switch } from "@/components/ui/switch";
import { BillingPeriod } from "@/types/pricing";

interface BillingToggleProps {
  billingPeriod: BillingPeriod;
  toggleBillingPeriod: () => void;
}

const BillingToggle = ({ billingPeriod, toggleBillingPeriod }: BillingToggleProps) => {
  return (
    <div className="flex items-center justify-center mt-8 gap-3">
      <span className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-primary" : "text-muted-foreground"}`}>
        Monthly
      </span>
      <Switch
        checked={billingPeriod === "yearly"}
        onCheckedChange={toggleBillingPeriod}
        aria-label="Toggle billing period"
      />
      <span className={`text-sm font-medium ${billingPeriod === "yearly" ? "text-primary" : "text-muted-foreground"}`}>
        Yearly
      </span>
    </div>
  );
};

export default BillingToggle;
