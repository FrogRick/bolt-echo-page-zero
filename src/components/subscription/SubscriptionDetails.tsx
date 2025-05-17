
import React from "react";
import { format } from "date-fns";
import { CreditCard, Loader2, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PricingTier } from "@/types/pricing";

interface SubscriptionDetailsProps {
  subscription: {
    tier: string;
    status: string;
    isTrial: boolean;
    endDate?: string;
  };
  isRedirecting: boolean;
  currentTier?: PricingTier;
  onManageSubscription: () => void;
  onCancelClick: () => void;
}

const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({
  subscription,
  isRedirecting,
  currentTier,
  onManageSubscription,
  onCancelClick,
}) => {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Your Subscription</h1>
          <div className="flex items-center gap-2">
            <Badge className="text-lg py-1 px-3 bg-primary text-primary-foreground">
              {subscription.tier.toUpperCase()}
            </Badge>
            {subscription.isTrial && (
              <Badge variant="outline" className="ml-1">Trial</Badge>
            )}
            <Badge 
              className={
                subscription.status === "active" || subscription.status === "trialing" 
                  ? "bg-green-500 text-white" 
                  : "bg-amber-500 text-white"
              }
            >
              {subscription.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onManageSubscription}
            disabled={isRedirecting}
            className="whitespace-nowrap"
            variant="outline"
          >
            {isRedirecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Manage Billing
          </Button>
          
          {(subscription.status === "active" || subscription.status === "trialing") && (
            <Button
              variant="destructive"
              onClick={onCancelClick}
            >
              Cancel Subscription
            </Button>
          )}
        </div>
      </div>
      
      {subscription.endDate && (
        <div className="mt-4 flex items-center text-sm">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>
            {subscription.status === "trialing" 
              ? `Trial ends on ${format(new Date(subscription.endDate), "MMMM d, yyyy")}`
              : `Next billing date: ${format(new Date(subscription.endDate), "MMMM d, yyyy")}`
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDetails;
