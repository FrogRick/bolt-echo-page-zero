
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
    
    // Determine if this is monthly or yearly based on priceId
    const isYearly = priceId.includes("yearly");
    const tierName = priceId.split("-")[0]; // basic, premium, etc.
    
    // Pre-configured price IDs - would come from a database in a production app
    const priceMap: {[key: string]: string} = {
      "basic-monthly": "price_basic_monthly",
      "basic-yearly": "price_basic_yearly",
      "premium-monthly": "price_premium_monthly",
      "premium-yearly": "price_premium_yearly",
      "enterprise-monthly": "price_enterprise_monthly",
      "enterprise-yearly": "price_enterprise_yearly"
    };
    
    // If it's a special test price for development, use it directly
    const stripePriceId = priceId.startsWith("price_") ? priceId : priceMap[priceId];
    if (!stripePriceId) throw new Error(`Invalid price ID: ${priceId}`);
    
    // Common session parameters
    const origin = new URL(req.url).origin;
    const successUrl = new URL(redirectUrl + "?success=true", origin).toString();
    const cancelUrl = new URL(redirectUrl, origin).toString();
    
    logStep("Creating checkout session", { 
      stripePriceId, 
      successUrl, 
      cancelUrl
    });
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1
        }
      ],
      mode: "subscription",
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier: tierName,
          billing: isYearly ? "yearly" : "monthly"
        },
        trial_period_days: 7 // Optional: 7-day trial
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
