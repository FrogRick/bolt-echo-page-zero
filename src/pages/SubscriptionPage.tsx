import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BillingPeriod, PricingTier, pricingTiers } from "@/types/pricing";
import { ResourceStatistics } from "@/types/subscription";
import PricingFooter from "@/components/pricing/PricingFooter";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

// Import refactored components
import SubscriptionDetails from "@/components/subscription/SubscriptionDetails";
import SubscriptionOverview from "@/components/subscription/SubscriptionOverview";
import ResourceUsageTable from "@/components/subscription/ResourceUsageTable";
import FeaturesList from "@/components/subscription/FeaturesList";
import UpgradePlans from "@/components/subscription/UpgradePlans";

const SubscriptionPage = () => {
  const { user, subscription, buildingUsage, refreshSubscription, createCheckoutSession, createCustomerPortalSession, cancelSubscription } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasInitiallyRefreshed, setHasInitiallyRefreshed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [resourceStats, setResourceStats] = useState<ResourceStatistics>({
    buildings: { used: 0, total: buildingUsage.limits.total || 10 },
    organizations: { used: 0, total: 5 },
    templates: { used: 0, total: 10 },
    evacuationPlans: { used: 0, total: buildingUsage.limits.total * 5 || 50 }
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Only refresh subscription data once when the component mounts
    if (!hasInitiallyRefreshed && user) {
      refreshSubscription();
      setHasInitiallyRefreshed(true);
    }
    
    // Check for success parameter in URL when component mounts
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    // If success parameter exists, refresh subscription data and remove it from URL
    if (success === 'true' && user) {
      console.log("Subscription checkout successful, refreshing subscription data");
      refreshSubscription();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refreshSubscription, user, hasInitiallyRefreshed]);

  // Fetch detailed resource statistics
  useEffect(() => {
    const fetchResourceStatistics = async () => {
      if (!user) return;
      
      setIsLoadingStats(true);
      try {
        // Get buildings count
        const { count: buildingsCount } = await supabase
          .from("buildings")
          .select("*", { count: "exact", head: true });

        // Get organizations count
        const { count: orgsCount } = await supabase
          .from("organizations")
          .select("*", { count: "exact", head: true });

        // Get templates count
        const { count: templatesCount } = await supabase
          .from("templates")
          .select("*", { count: "exact", head: true });

        // Get floor plans count (representing evacuation plans)
        const { count: plansCount } = await supabase
          .from("floor_plans")
          .select("*", { count: "exact", head: true });

        // Get the limits based on subscription tier - Fixed: Using the correct tier IDs from pricingTiers
        const limits = {
          buildings: buildingUsage.limits.total || 10,
          organizations: subscription.tier === 'free' ? 1 : 
                        subscription.tier === 'basic' ? 3 : 
                        subscription.tier === 'pro' ? 10 : 
                        subscription.tier === 'team' ? 25 : 50,
          templates: subscription.tier === 'free' ? 2 : 
                    subscription.tier === 'basic' ? 10 : 
                    subscription.tier === 'pro' ? 25 : 
                    subscription.tier === 'team' ? 50 : 100,
          evacuationPlans: subscription.tier === 'free' ? 5 : 
                          subscription.tier === 'basic' ? buildingUsage.limits.total * 5 : 
                          subscription.tier === 'pro' ? buildingUsage.limits.total * 10 : 
                          subscription.tier === 'team' ? buildingUsage.limits.total * 15 : 
                          buildingUsage.limits.total * 20
        };

        setResourceStats({
          buildings: { used: buildingsCount || 0, total: limits.buildings },
          organizations: { used: orgsCount || 0, total: limits.organizations },
          templates: { used: templatesCount || 0, total: limits.templates },
          evacuationPlans: { used: plansCount || 0, total: limits.evacuationPlans }
        });
      } catch (error) {
        console.error("Error fetching resource statistics:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (user) {
      fetchResourceStatistics();
    }
  }, [user, subscription.tier, buildingUsage.limits.total]);

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

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const success = await cancelSubscription();
      if (success) {
        setShowCancelDialog(false);
        // Refresh subscription data
        await refreshSubscription();
      }
    } finally {
      setIsCancelling(false);
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
        <SubscriptionDetails 
          subscription={subscription}
          isRedirecting={isRedirecting}
          currentTier={currentTier}
          onManageSubscription={handleManageSubscription}
          onCancelClick={() => setShowCancelDialog(true)}
        />

        <Tabs
          defaultValue="overview"
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-8"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <SubscriptionOverview 
              subscription={subscription}
              buildingUsage={buildingUsage}
              currentTier={currentTier}
            />
          </TabsContent>
          
          <TabsContent value="usage" className="mt-6">
            <ResourceUsageTable 
              resourceStats={resourceStats}
              buildingUsage={buildingUsage}
            />
          </TabsContent>
          
          <TabsContent value="features" className="mt-6">
            <FeaturesList 
              currentTier={currentTier}
              subscriptionTier={subscription.tier}
            />
          </TabsContent>
        </Tabs>
        
        <UpgradePlans 
          pricingTiers={pricingTiers}
          billingPeriod={billingPeriod}
          toggleBillingPeriod={toggleBillingPeriod}
          loadingTier={loadingTier}
          subscriptionTier={subscription.tier}
          calculateSavings={calculateSavings}
          handleSubscribe={handleSubscribe}
        />
        
        <PricingFooter />

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
              <AlertDialogDescription>
                Your subscription will remain active until the end of the current billing period. 
                After that, your account will be downgraded to the free tier.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>Never mind</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault();
                  handleCancelSubscription();
                }}
                disabled={isCancelling}
                className="bg-destructive text-destructive-foreground"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  "Yes, cancel my subscription"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Otherwise show pricing page
  return (
    <div className="container mx-auto py-12 px-4">
      <UpgradePlans 
        pricingTiers={pricingTiers}
        billingPeriod={billingPeriod}
        toggleBillingPeriod={toggleBillingPeriod}
        loadingTier={loadingTier}
        subscriptionTier={subscription.tier}
        calculateSavings={calculateSavings}
        handleSubscribe={handleSubscribe}
      />

      <PricingFooter />
    </div>
  );
};

export default SubscriptionPage;
