
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { stripe } from "../_shared/stripe.ts";

// For security, this function should only be run once to set up products in your Stripe account
// You should disable it after running it successfully
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Setting up Stripe products and prices");

    // Product setup
    const products = {
      basic: await setupProduct("Basic", "Create evacuation plans with limited functionality", "green"),
      pro: await setupProduct("Pro", "For small businesses or sole proprietors", "blue", true),
      team: await setupProduct("Team", "Small fire protection companies, housing companies, etc.", "yellow"),
      enterprise: await setupProduct("Enterprise", "Larger companies, municipalities, national actors", "red")
    };

    // Price setup - all prices in EUR cents
    const prices = {
      basic: {
        monthly: await setupPrice(products.basic.id, 900, "month"), // €9/month
        yearly: await setupPrice(products.basic.id, 9000, "year")   // €90/year
      },
      pro: {
        monthly: await setupPrice(products.pro.id, 4900, "month"),  // €49/month
        yearly: await setupPrice(products.pro.id, 49000, "year")    // €490/year
      },
      team: {
        monthly: await setupPrice(products.team.id, 14900, "month"), // €149/month
        yearly: await setupPrice(products.team.id, 149000, "year")   // €1490/year
      }
      // Enterprise is custom pricing, so no fixed prices
    };

    // Return the created products and prices so you know what IDs to use
    return new Response(JSON.stringify({ 
      products,
      prices,
      usage: "Use these price IDs in your create-checkout function"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error setting up Stripe products:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  // Helper function to create a product
  async function setupProduct(name: string, description: string, color: string, isDefault = false) {
    const product = await stripe.products.create({
      name: name,
      description: description,
      metadata: {
        color: color,
        isDefault: isDefault.toString()
      }
    });
    console.log(`Created product: ${name} (${product.id})`);
    return product;
  }

  // Helper function to create a price
  async function setupPrice(productId: string, unitAmount: number, interval: "month" | "year") {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: unitAmount,
      currency: "eur",
      recurring: { interval }
    });
    console.log(`Created price: ${price.id} (${unitAmount / 100}€/${interval})`);
    return price;
  }
});
