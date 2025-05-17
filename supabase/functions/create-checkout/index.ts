
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";
import { stripe } from "../_shared/stripe.ts";

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");
    
    // Verify auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body for price ID and redirect URL
    const { priceId, redirectUrl = "/" } = await req.json();
    if (!priceId) throw new Error("No price ID provided");
    logStep("Price ID received", { priceId });
    
    // Check if user already exists as a Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      // Create a new customer if none exists
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = newCustomer.id;
      logStep("Created new customer", { customerId });
    }
    
    // Determine the tier name and billing period
    let tierName = priceId.split("-")[0]; // basic, pro, team
    let billingPeriod = "monthly";
    
    if (priceId.includes("yearly")) {
      billingPeriod = "yearly";
    }
    
    logStep("Determined tier and billing", { tierName, billingPeriod });
    
    // Calculate price based on tier and billing period
    let unitAmount;
    let trialPeriodDays;
    
    switch (tierName) {
      case "basic":
        unitAmount = billingPeriod === 'yearly' ? 9999 : 999; // $9.99/mo or $99.99/yr
        trialPeriodDays = 14;
        break;
      case "pro":
        unitAmount = billingPeriod === 'yearly' ? 29999 : 2999; // $29.99/mo or $299.99/yr
        break;
      case "team":
        unitAmount = billingPeriod === 'yearly' ? 49999 : 4999; // $49.99/mo or $499.99/yr
        break;
      default:
        throw new Error(`Unknown tier: ${tierName}`);
    }
    
    // Common session parameters
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const successUrl = new URL(redirectUrl + "?success=true", origin).toString();
    const cancelUrl = new URL(redirectUrl, origin).toString();
    
    logStep("Creating checkout session", { 
      tierName,
      unitAmount,
      billingPeriod,
      successUrl, 
      cancelUrl
    });
    
    // For testing purposes, we'll use a simple line item
    const lineItems = [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${tierName.charAt(0).toUpperCase() + tierName.slice(1)} Plan (${billingPeriod})`,
          metadata: {
            tier: tierName
          }
        },
        unit_amount: unitAmount,
        recurring: {
          interval: billingPeriod === 'yearly' ? 'year' : 'month',
        },
      },
      quantity: 1
    }];
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "subscription",
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier: tierName,
          billing: billingPeriod
        },
        trial_period_days: trialPeriodDays
      },
      success_url: successUrl,
      cancel_url: cancelUrl
    });
    
    logStep("Checkout session created", { sessionId: session.id, url: session.url });
    
    if (!session.url) throw new Error("Failed to generate checkout URL");
    
    return new Response(JSON.stringify({ url: session.url }), {
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
