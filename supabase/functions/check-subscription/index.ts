
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";
import { stripe } from "../_shared/stripe.ts";

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform secure operations in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");
    
    // Verify auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user exists in Stripe as a customer
    const customers = await stripe.customers.list({ 
      email: user.email,
      limit: 1 
    });
    
    // Set default building limits for free tier
    const defaultLimits = { total: 2, monthly: 1 };
    let buildingUsage = {
      total: 0,
      monthly: 0,
      limits: defaultLimits
    };
    
    // Get user's building usage from Supabase
    const { data: countData } = await supabaseClient
      .from("user_building_counts")
      .select("buildings_count")
      .eq("user_id", user.id)
      .single();
      
    if (countData) {
      buildingUsage.total = countData.buildings_count || 0;
    }
    
    // Count buildings created this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const { count: monthlyCount } = await supabaseClient
      .from("buildings")
      .select("id", { count: 'exact', head: false })
      .eq("owner_id", user.id)
      .gte("created_at", firstDayOfMonth.toISOString());
      
    buildingUsage.monthly = monthlyCount || 0;
    
    // If no customer found in Stripe, return free tier data
    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier data");
      return new Response(JSON.stringify({
        subscription: {
          tier: "free",
          status: "inactive",
          end_date: null,
          is_trial: false
        },
        buildings: buildingUsage
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      expand: ['data.items.data.price.product'],
      limit: 1,
    });
    
    // Also check for trial subscriptions
    const trialSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      expand: ['data.items.data.price.product'],
      limit: 1,
    });
    
    let hasSubscription = subscriptions.data.length > 0;
    let subscription = hasSubscription ? subscriptions.data[0] : null;
    let isTrial = false;
    
    // If no active subscription but has trial
    if (!hasSubscription && trialSubscriptions.data.length > 0) {
      subscription = trialSubscriptions.data[0];
      hasSubscription = true;
      isTrial = true;
    }
    
    let subscriptionTier = "free";
    let subscriptionStatus = "inactive";
    let subscriptionEnd = null;

    if (hasSubscription && subscription) {
      // Get subscription details
      subscriptionStatus = subscription.status;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Determine tier from the product
      const product = subscription.items.data[0].price.product;
      if (typeof product !== 'string') {
        subscriptionTier = product.name.toLowerCase().includes('basic') ? 'basic' : 
                          product.name.toLowerCase().includes('premium') ? 'premium' : 
                          product.name.toLowerCase().includes('enterprise') ? 'enterprise' : 'free';
      }
      
      logStep("Subscription found", { 
        tier: subscriptionTier, 
        status: subscriptionStatus,
        endDate: subscriptionEnd,
        isTrial
      });
      
      // Update building limits based on subscription tier
      if (subscriptionTier === 'basic') {
        buildingUsage.limits = { total: 10, monthly: 5 };
      } else if (subscriptionTier === 'premium') {
        buildingUsage.limits = { total: 50, monthly: 20 };
      } else if (subscriptionTier === 'enterprise') {
        buildingUsage.limits = { total: 500, monthly: 100 };
      }
    } else {
      logStep("No active subscription found");
    }

    // Return subscription and usage data
    return new Response(JSON.stringify({
      subscription: {
        tier: subscriptionTier,
        status: subscriptionStatus,
        end_date: subscriptionEnd,
        is_trial: isTrial
      },
      buildings: buildingUsage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
