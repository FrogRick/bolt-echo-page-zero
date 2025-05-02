
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BillingPeriod, PricingTier, pricingTiers } from "@/types/pricing";
import PricingHeader from "@/components/pricing/PricingHeader";
import PricingTierCard from "@/components/pricing/PricingTierCard";
import PricingFooter from "@/components/pricing/PricingFooter";
import { AlertCircle, CalendarIcon, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SubscriptionPage = () => {
  const { user, subscription, buildingUsage, refreshSubscription, createCheckoutSession, createCustomerPortalSession } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Refresh subscription data when the component mounts
    refreshSubscription();
  }, [refreshSubscription]);

  const handleSubscribe = async (tier: PricingTier) => {
    // Get redirect URL from session if available
    const redirectPath = sessionStorage.getItem("subscriptionRedirect") || "/";
    
    if (!user) {
      // Store the current path to redirect back after authentication
      sessionStorage.setItem("authRedirect", `/pricing?redirect=${encodeURIComponent(redirectPath)}`);
      navigate("/auth?tab=signup");
      return;
    }

    if (tier.id === subscription.tier) {
      // If user already has this tier, redirect them to the saved redirect path
      navigate(redirectPath);
      return;
    }

    setLoadingTier(tier.id);
    try {
      // Pass billing period to create checkout session
      const checkoutUrl = await createCheckoutSession(`${tier.id}-${billingPeriod}`);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsRedirecting(true);
    try {
      const url = await createCustomerPortalSession();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating customer portal session:", error);
    } finally {
      setIsRedirecting(false);
    }
  };

  const toggleBillingPeriod = () => {
    setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly");
  };

  // Calculate yearly savings percentage
  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    return Math.round((savings / monthlyCost) * 100);
  };

  // Show subscription page if user has a subscription, otherwise show pricing tiers
  if (user && subscription && subscription.tier && subscription.tier !== "free") {
    const currentTier = pricingTiers.find(tier => tier.id === subscription.tier);
    
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Subscription</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold capitalize">{subscription.tier}</h3>
                    {subscription.isTrial && (
                      <Badge variant="outline" className="ml-2">
                        Trial
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    className={
                      subscription.status === "active" || subscription.status === "trialing" 
                        ? "bg-green-500" 
                        : "bg-amber-500"
                    }
                  >
                    {subscription.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {currentTier?.price.monthly && `$${currentTier.price.monthly}/month`}
                </p>
                
                {subscription.endDate && (
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
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
              
              <div className="space-y-2">
                <h4 className="font-medium">Features</h4>
                <ul className="space-y-2">
                  {currentTier?.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleManageSubscription}
                disabled={isRedirecting}
              >
                {isRedirecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>Your current resource usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Buildings</span>
                  <span className="font-medium">{buildingUsage.total} / {buildingUsage.limits.total}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min((buildingUsage.total / buildingUsage.limits.total) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>New Buildings This Month</span>
                  <span className="font-medium">{buildingUsage.monthly} / {buildingUsage.limits.monthly}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min((buildingUsage.monthly / buildingUsage.limits.monthly) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {buildingUsage.total >= buildingUsage.limits.total || buildingUsage.monthly >= buildingUsage.limits.monthly ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Usage Limit Reached</AlertTitle>
                  <AlertDescription>
                    You've reached your plan's usage limits. Consider upgrading your plan to add more buildings.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="text-sm text-muted-foreground">
                  You can add {buildingUsage.limits.total - buildingUsage.total} more buildings in total, 
                  with {buildingUsage.limits.monthly - buildingUsage.monthly} available this month.
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Upgrade Your Plan</h2>
          <PricingHeader 
            billingPeriod={billingPeriod} 
            toggleBillingPeriod={toggleBillingPeriod} 
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {pricingTiers
              .filter(tier => tier.id !== subscription.tier)
              .map((tier) => (
                <PricingTierCard
                  key={tier.id}
                  tier={tier}
                  billingPeriod={billingPeriod}
                  loadingTier={loadingTier}
                  subscriptionTier={subscription.tier}
                  calculateSavings={calculateSavings}
                  handleSubscribe={handleSubscribe}
                />
              ))}
          </div>
        </div>
        
        <PricingFooter />
      </div>
    );
  }

  // Otherwise show pricing page
  return (
    <div className="container mx-auto py-12 px-4">
      <PricingHeader 
        billingPeriod={billingPeriod} 
        toggleBillingPeriod={toggleBillingPeriod} 
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pricingTiers.map((tier) => (
          <PricingTierCard
            key={tier.id}
            tier={tier}
            billingPeriod={billingPeriod}
            loadingTier={loadingTier}
            subscriptionTier={subscription.tier}
            calculateSavings={calculateSavings}
            handleSubscribe={handleSubscribe}
          />
        ))}
      </div>

      <PricingFooter />
    </div>
  );
};

export default SubscriptionPage;
