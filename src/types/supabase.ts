
import { Database } from "@/integrations/supabase/types";

// Re-export database types for convenience
export type { Database } from "@/integrations/supabase/types";

// Define type aliases for easier access to table types
export type ProfilesTable = Database['public']['Tables']['profiles']['Row'];
export type BuildingsTable = Database['public']['Tables']['buildings']['Row']; 
export type FloorPlansTable = Database['public']['Tables']['floor_plans']['Row'];
export type ElementsTable = Database['public']['Tables']['elements']['Row'];
export type SubscriptionTiersTable = Database['public']['Tables']['subscription_tiers']['Row'];
export type UserBuildingCountsTable = Database['public']['Tables']['user_building_counts']['Row'];

// Additional custom types for the application
export interface UserProfile extends ProfilesTable {
  // Add any additional fields not in the database but needed in the app
  stripe_customer_id?: string;
}

// Type definitions for subscription data returned from the check-subscription endpoint
export interface SubscriptionData {
  subscription: {
    tier: string;
    status: string;
    end_date: string | null;
    is_trial: boolean;
  };
  buildings: {
    total: number;
    monthly: number;
    limits: {
      total: number;
      monthly: number;
    };
  };
}

// Define a simpler Project type to avoid excessive type instantiation
export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}
