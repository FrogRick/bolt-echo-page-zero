
import { supabase } from "@/integrations/supabase/client";
import { pricingTiers } from "@/types/pricing";

/**
 * This script updates the subscription_tiers table in Supabase to match
 * the pricing tiers defined in the application.
 */
export async function updateSubscriptionTiers() {
  console.log("Updating subscription tiers in database...");

  // Delete existing subscription tiers
  const { error: deleteError } = await supabase
    .from('subscription_tiers')
    .delete()
    .not('id', 'eq', 'custom'); // Keep any custom tiers if they exist
  
  if (deleteError) {
    console.error("Error deleting existing subscription tiers:", deleteError);
    return;
  }

  // Insert the subscription tiers from the pricing config
  for (const tier of pricingTiers) {
    const { error } = await supabase
      .from('subscription_tiers')
      .upsert({
        id: tier.id,
        name: tier.name,
        buildings_limit: tier.buildingLimit === "unlimited" ? 9999 : tier.buildingLimit,
        price: tier.price.monthly || 0,
        description: tier.description || null
      });
    
    if (error) {
      console.error(`Error inserting tier ${tier.id}:`, error);
    } else {
      console.log(`Successfully inserted tier: ${tier.id}`);
    }
  }
  
  console.log("Subscription tiers update completed");
}
