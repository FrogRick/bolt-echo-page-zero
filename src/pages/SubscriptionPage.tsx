
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BillingPeriod, PricingTier, pricingTiers } from "@/types/pricing";
import PricingHeader from "@/components/pricing/PricingHeader";
import PricingTierCard from "@/components/pricing/PricingTierCard";
import PricingFooter from "@/components/pricing/PricingFooter";
import { AlertCircle, AlertTriangle, CalendarIcon, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
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
import { ResourceCounters } from "@/components/ResourceCounters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const SubscriptionPage = () => {
  const { user, subscription, buildingUsage, refreshSubscription, createCheckoutSession, createCustomerPortalSession, cancelSubscription } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasInitiallyRefreshed, setHasInitiallyRefreshed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
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
                onClick={handleManageSubscription}
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
                  onClick={() => setShowCancelDialog(true)}
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
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Your Resources</h2>
              <ResourceCounters />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Plan</TableCell>
                        <TableCell className="capitalize">{subscription.tier}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Status</TableCell>
                        <TableCell className="capitalize">{subscription.status}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Price</TableCell>
                        <TableCell>
                          {currentTier?.price.monthly && `$${currentTier.price.monthly}/month`}
                        </TableCell>
                      </TableRow>
                      {subscription.endDate && (
                        <TableRow>
                          <TableCell className="font-medium">
                            {subscription.isTrial ? "Trial End Date" : "Next Billing Date"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(subscription.endDate), "MMMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Current Building Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Total Buildings</span>
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
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="usage" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>Overview of your resource usage compared to limits</CardDescription>
              </CardHeader>
              <CardContent>
                {buildingUsage.total >= buildingUsage.limits.total || buildingUsage.monthly >= buildingUsage.limits.monthly ? (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Usage Limit Reached</AlertTitle>
                    <AlertDescription>
                      You've reached your plan's usage limits. Consider upgrading your plan to add more buildings.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="text-sm text-muted-foreground mb-6">
                    You can add {buildingUsage.limits.total - buildingUsage.total} more buildings in total, 
                    with {buildingUsage.limits.monthly - buildingUsage.monthly} available this month.
                  </div>
                )}
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead>Available</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Buildings</TableCell>
                      <TableCell>{buildingUsage.total}</TableCell>
                      <TableCell>{buildingUsage.limits.total}</TableCell>
                      <TableCell>{buildingUsage.limits.total - buildingUsage.total}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Monthly New Buildings</TableCell>
                      <TableCell>{buildingUsage.monthly}</TableCell>
                      <TableCell>{buildingUsage.limits.monthly}</TableCell>
                      <TableCell>{buildingUsage.limits.monthly - buildingUsage.monthly}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan Features</CardTitle>
                <CardDescription>Features included in your {subscription.tier} plan</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentTier?.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-[#1cdd86] mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
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
