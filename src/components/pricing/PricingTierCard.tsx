
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { PricingTier, BillingPeriod } from "@/types/pricing";

interface PricingTierCardProps {
  tier: PricingTier;
  billingPeriod: BillingPeriod;
  loadingTier: string | null;
  subscriptionTier: string;
  calculateSavings: (monthlyPrice: number, yearlyPrice: number) => number;
  handleSubscribe: (tier: PricingTier) => Promise<void>;
}

const PricingTierCard = ({
  tier,
  billingPeriod,
  loadingTier,
  subscriptionTier,
  calculateSavings,
  handleSubscribe,
}: PricingTierCardProps) => {
  return (
    <Card 
      className={`flex flex-col border-primary border shadow-md ${
        tier.id === 'pro' ? 'shadow-lg' : ''
      }`}
    >
      <CardHeader>
        <CardTitle className="text-2xl">{tier.name}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-6">
          {tier.price.monthly !== null ? (
            <>
              <span className="text-4xl font-bold">
                €{billingPeriod === "monthly" ? tier.price.monthly : tier.price.yearly}
              </span>
              <span className="text-gray-500 ml-2">
                /{billingPeriod === "monthly" ? "month" : "year"}
              </span>
              {billingPeriod === "yearly" && tier.price.monthly && tier.price.yearly && (
                <div className="mt-1 text-sm text-green-600 font-medium">
                  Save {calculateSavings(tier.price.monthly, tier.price.yearly)}%
                </div>
              )}
            </>
          ) : (
            <span className="text-2xl font-bold">Custom pricing</span>
          )}
          {tier.trial && billingPeriod === "monthly" && (
            <div className="mt-1 text-sm text-green-600 font-medium">
              {tier.trial.days}-day free trial
            </div>
          )}
          {/* Add spacer when there's no trial to maintain consistent card height */}
          {(!tier.trial || billingPeriod !== "monthly") && (
            <div className="h-5">&#8203;</div>
          )}
        </div>
        
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={() => handleSubscribe(tier)} 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          variant="default"
          disabled={loadingTier === tier.id || tier.id === subscriptionTier}
        >
          {loadingTier === tier.id ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : tier.id === subscriptionTier ? (
            "Current Plan"
          ) : (
            tier.buttonText
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingTierCard;
