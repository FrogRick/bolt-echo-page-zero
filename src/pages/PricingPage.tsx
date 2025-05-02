
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { pricingTiers, BillingPeriod, PricingTier } from "@/types/pricing";
import PricingHeader from "@/components/pricing/PricingHeader";
import PricingTierCard from "@/components/pricing/PricingTierCard";
import PricingFooter from "@/components/pricing/PricingFooter";

const PricingPage = () => {
  const { user, subscription, createCheckoutSession } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const navigate = useNavigate();

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

  const toggleBillingPeriod = () => {
    setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly");
  };

  // Calculate yearly savings percentage
  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    return Math.round((savings / monthlyCost) * 100);
  };

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

export default PricingPage;
