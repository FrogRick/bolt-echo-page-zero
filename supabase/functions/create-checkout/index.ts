
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logInfo(message, data = {}) {
  console.log(`INFO: ${message}`, JSON.stringify(data, null, 2));
}

function logError(message, error) {
  console.error(`ERROR: ${message}`, error);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, redirectUrl } = await req.json();
    logInfo("Received request with:", { priceId, redirectUrl });
    
    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    
    logInfo("Authenticating user with token", { tokenLength: authHeader.length });
    
    // Use the token to get the authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Authentication failed");
    }
    
    logInfo("Authenticated user:", { userId: user.id, email: user.email });
    
    // Get the Stripe API key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }
    
    logInfo("Stripe secret key found", { keyLength: stripeKey.length });
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });
    
    // Check if there's an existing customer with this email
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    
    logInfo("Customer ID from profiles:", profile);
    
    let customerId;
    
    // If the user doesn't have a Stripe customer ID yet, create one
    if (!profile?.stripe_customer_id) {
      logInfo("Creating new Stripe customer for user:", { userId: user.id });
      
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
        name: `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.trim() || undefined,
      });
      
      customerId = customer.id;
      logInfo("Created new Stripe customer:", { customerId });
      
      // Update the user profile with the new customer ID
      try {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);
        
        if (updateError) {
          logError("Error updating profile with stripe_customer_id:", updateError);
        }
      } catch (error) {
        logError("Error updating profile with stripe_customer_id:", error);
      }
    } else {
      customerId = profile.stripe_customer_id;
    }
    
    // Split the priceId to get the tier name and billing period (e.g. 'premium-monthly')
    const [tierName, billingPeriod] = priceId ? priceId.split('-') : ['basic', 'monthly'];
    logInfo(`Detected billing period: ${billingPeriod} for tier: ${tierName}`, {});
    
    // Look for existing products that match this tier
    const products = await stripe.products.list({
      active: true,
    });
    logInfo("Searching for existing products", { productCount: products.data.length });
    
    // Check if we have a matching product
    let stripePriceId;
    let product = products.data.find(p => p.name.toLowerCase().includes(tierName));
    
    if (product) {
      logInfo("Found existing product", { 
        productId: product.id,
        productName: product.name
      });
      
      // Get prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });
      logInfo("Searching prices for product", { priceCount: prices.data.length });
      
      // Find the right price based on billing period
      const price = prices.data.find(p => {
        const isRecurring = p.recurring !== null;
        const interval = p.recurring?.interval;
        if (billingPeriod === 'yearly' && interval === 'year') return true;
        if (billingPeriod === 'monthly' && interval === 'month') return true;
        return false;
      });
      
      if (price) {
        stripePriceId = price.id;
        logInfo("Found existing price", { 
          stripePriceId,
          interval: price.recurring?.interval
        });
      } else {
        // Need to create a price for this product
        logInfo("No matching price found, creating new one", {});
        
        // Amount in cents
        let amount;
        if (tierName === 'basic') {
          amount = billingPeriod === 'monthly' ? 900 : 8900; 
        } else if (tierName === 'premium') {
          amount = billingPeriod === 'monthly' ? 4900 : 49000;
        } else if (tierName === 'enterprise') {
          amount = billingPeriod === 'monthly' ? 29000 : 290000;
        }
        
        const newPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: amount,
          currency: 'usd',
          recurring: {
            interval: billingPeriod === 'yearly' ? 'year' : 'month'
          },
          metadata: {
            tier: tierName
          }
        });
        
        stripePriceId = newPrice.id;
        logInfo("Created new price", { 
          stripePriceId, 
          amount, 
          interval: billingPeriod === 'yearly' ? 'year' : 'month' 
        });
      }
    } else {
      // Need to create a new product and price
      logInfo("No matching product found, creating new ones", {});
      
      // Create the product first
      const newProduct = await stripe.products.create({
        name: `Fireplanner ${tierName.charAt(0).toUpperCase() + tierName.slice(1)} ${billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)}`,
        metadata: {
          tier: tierName
        }
      });
      
      // Amount in cents
      let amount;
      if (tierName === 'basic') {
        amount = billingPeriod === 'monthly' ? 900 : 8900; 
      } else if (tierName === 'premium') {
        amount = billingPeriod === 'monthly' ? 4900 : 49000;
      } else if (tierName === 'enterprise') {
        amount = billingPeriod === 'monthly' ? 29000 : 290000;
      }
      
      // Create the price
      const newPrice = await stripe.prices.create({
        product: newProduct.id,
        unit_amount: amount,
        currency: 'usd',
        recurring: {
          interval: billingPeriod === 'yearly' ? 'year' : 'month'
        },
        metadata: {
          tier: tierName
        }
      });
      
      stripePriceId = newPrice.id;
      logInfo("Created new price", { 
        stripePriceId, 
        amount, 
        interval: billingPeriod === 'yearly' ? 'year' : 'month' 
      });
    }
    
    // Set up subscription data
    const subscriptionData = {
      metadata: {
        supabase_user_id: user.id
      }
    };
    
    // Add trial period for basic tier
    if (tierName === 'basic') {
      logInfo("Adding 14-day trial period for basic tier", {});
      subscriptionData.trial_period_days = 14;
    }
    
    // Get the origin from the request headers
    const origin = req.headers.get("origin") || 'https://preview--escape-plan-forge.lovable.app';
    
    // Create a checkout session
    const successUrl = `${origin}${redirectUrl || "/subscription?success=true"}`;
    logInfo("Creating checkout session with:", {
      customerId,
      priceId: stripePriceId,
      successUrl: successUrl + "?success=true", 
      cancelUrl: `${origin}/pricing?canceled=true`,
      subscriptionData
    });
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: subscriptionData,
      success_url: successUrl + "?success=true",
      cancel_url: `${origin}/pricing?canceled=true`,
    });
    
    logInfo("Checkout session created:", {
      sessionId: session.id,
      url: session.url
    });
    
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logError("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
