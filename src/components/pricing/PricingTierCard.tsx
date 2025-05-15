
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  // Map colors to appropriate Tailwind classes
  const colorClasses = {
    green: "border-green-500 shadow-green-100",
    blue: "border-blue-500 shadow-blue-100",
    yellow: "border-yellow-500 shadow-yellow-100",
    red: "border-red-500 shadow-red-100"
  };
  
  const badgeColors = {
    green: "bg-green-500 hover:bg-green-600",
    blue: "bg-blue-500 hover:bg-blue-600",
    yellow: "bg-yellow-500 hover:bg-yellow-600",
    red: "bg-red-500 hover:bg-red-600"
  };
  
  const buttonVariants = {
    green: tier.popular ? "default" : "outline border-green-500 text-green-600 hover:bg-green-50",
    blue: tier.popular ? "default" : "outline border-blue-500 text-blue-600 hover:bg-blue-50",
    yellow: tier.popular ? "default" : "outline border-yellow-500 text-yellow-600 hover:bg-yellow-50",
    red: tier.popular ? "default" : "outline border-red-500 text-red-600 hover:bg-red-50"
  };
  
  const colorClass = colorClasses[tier.color as keyof typeof colorClasses] || '';
  const badgeColor = badgeColors[tier.color as keyof typeof badgeColors] || 'bg-primary hover:bg-primary';
  const buttonVariant = buttonVariants[tier.color as keyof typeof buttonVariants] || 
                        (tier.popular ? "default" : "outline");

  return (
    <Card 
      className={`flex flex-col ${tier.popular ? 'border-primary shadow-lg relative' : ''} ${colorClass}`}
    >
      {tier.color && (
        <div className="h-2 w-full rounded-t-lg bg-gradient-to-r from-transparent to-transparent" 
             style={{ backgroundColor: tier.color === 'green' ? '#10b981' 
                                    : tier.color === 'blue' ? '#3b82f6'
                                    : tier.color === 'yellow' ? '#f59e0b'
                                    : tier.color === 'red' ? '#ef4444' : 'transparent' }}
        />
      )}
      
      {tier.popular && (
        <Badge className={`absolute top-4 right-4 ${badgeColor}`}>
          Popular
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{tier.name}</CardTitle>
        {/* Description removed as requested */}
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
          className="w-full"
          variant={tier.popular ? "default" : "outline"}
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
