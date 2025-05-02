
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
    .neq('id', 'custom'); // Keep any custom tiers if they exist
  
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
        max_buildings: tier.buildingLimit,
        max_new_buildings_per_month: tier.monthlyBuildingLimit,
        price_monthly: tier.price.monthly || 0
      });
    
    if (error) {
      console.error(`Error inserting tier ${tier.id}:`, error);
    } else {
      console.log(`Successfully inserted tier: ${tier.id}`);
    }
  }
  
  console.log("Subscription tiers update completed");
}
