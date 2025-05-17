
import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingTier } from "@/types/pricing";

interface FeaturesListProps {
  currentTier?: PricingTier;
  subscriptionTier: string;
}

const FeaturesList: React.FC<FeaturesListProps> = ({ currentTier, subscriptionTier }) => {
  if (!currentTier) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Features</CardTitle>
        <CardDescription>Features included in your {subscriptionTier} plan</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {currentTier.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-[#1cdd86] mr-2" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default FeaturesList;
