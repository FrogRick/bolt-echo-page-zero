import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type SubscriptionTier = "free" | "basic" | "premium" | "enterprise" | "custom";

type SubscriptionStatus = "active" | "inactive" | "past_due" | "canceled" | "trialing";

type SubscriptionInfo = {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  endDate: Date | null;
  isTrial: boolean;
};

type BuildingUsage = {
  total: number;
  monthly: number;
  limits: {
    total: number;
    monthly: number;
  };
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  subscription: SubscriptionInfo;
  buildingUsage: BuildingUsage;
  refreshSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  createCheckoutSession: (priceId?: string) => Promise<string | undefined>;
  createCustomerPortalSession: () => Promise<string | undefined>;
};

const defaultSubscription: SubscriptionInfo = {
  tier: "free",
  status: "inactive",
  endDate: null,
  isTrial: false
};

const defaultBuildingUsage: BuildingUsage = {
  total: 0,
  monthly: 0,
  limits: {
    total: 0,
    monthly: 0,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(defaultSubscription);
  const [buildingUsage, setBuildingUsage] = useState<BuildingUsage>(defaultBuildingUsage);
  const [isRefreshingSubscription, setIsRefreshingSubscription] = useState(false);
  const { toast } = useToast();
  const [refreshCount, setRefreshCount] = useState(0);

  // Function to refresh subscription data
  const refreshSubscription = async () => {
    if (!user || isRefreshingSubscription) return;
    
    try {
      setIsRefreshingSubscription(true);
      console.log("Refreshing subscription data for user", user.id);
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Failed to check subscription:", error);
        return;
      }
      
      if (data) {
        console.log("Subscription data received:", data);
        setSubscription({
          tier: data.subscription.tier,
          status: data.subscription.status,
          endDate: data.subscription.end_date ? new Date(data.subscription.end_date) : null,
          isTrial: data.subscription.is_trial || false
        });
        
        setBuildingUsage({
          total: data.buildings.total,
          monthly: data.buildings.monthly,
          limits: {
            total: data.buildings.limits.total,
            monthly: data.buildings.limits.monthly,
          },
        });
        
        // Trigger a refresh count update to ensure components re-render
        setRefreshCount(prevCount => prevCount + 1);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setIsRefreshingSubscription(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          toast({
            title: "Signed in successfully",
            description: `Welcome back${session?.user?.user_metadata?.first_name ? ", " + session.user.user_metadata.first_name : ""}!`,
          });
          // Refresh subscription data when user signs in
          refreshSubscription();
        }
        if (event === 'SIGNED_OUT') {
          toast({ 
            title: "Signed out", 
            description: "You have been signed out." 
          });
          // Reset subscription data when user signs out
          setSubscription(defaultSubscription);
          setBuildingUsage(defaultBuildingUsage);
        }
        
        // If this is a new sign-up (SIGNED_UP event), automatically start the basic tier trial
        if (event === 'SIGNED_UP' && session?.user) {
          console.log("New user signed up, starting Basic tier trial");
          // Automatically start the 14-day trial of basic tier
          setTimeout(async () => {
            try {
              // Create a checkout session for the basic tier with trial
              const { data, error } = await supabase.functions.invoke("create-checkout", {
                body: { 
                  priceId: "basic-monthly",
                  redirectUrl: "/subscription?success=true"
                }
              });
              
              if (error) {
                console.error("Error starting trial:", error);
                return;
              }
              
              if (data?.url) {
                // Redirect to checkout page to complete trial activation
                window.location.href = data.url;
              }
            } catch (error) {
              console.error("Error starting trial:", error);
            }
          }, 1000); // Small delay to ensure auth is fully processed
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check subscription status for existing session
        refreshSubscription();
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  // Add a useEffect to refresh subscription data when success parameter is in URL
  useEffect(() => {
    // Check for success parameter in URL when component mounts
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    // If success parameter exists, refresh subscription data
    if (success === 'true' && user) {
      console.log("Subscription checkout successful, refreshing subscription data");
      refreshSubscription();
      
      // Remove success parameter from URL to prevent refreshing on every render
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });
      if (error) {
        console.error("Sign up failed:", error, data);
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      } else {
        console.log("Sign up success:", data);
        toast({
          title: "Sign up successful",
          description: "Please check your email for a confirmation link.",
        });
      }
    } catch (error: any) {
      console.error("Sign up exception:", error);
      toast({
        title: "Sign up failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const createCheckoutSession = async (priceId?: string): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          priceId,
          redirectUrl: "/subscription?success=true" // Change to redirect to subscription page
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Could not create checkout session",
          variant: "destructive",
        });
        return undefined;
      }

      return data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return undefined;
    }
  };

  const createCustomerPortalSession = async (): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) {
        toast({
          title: "Error",
          description: "Could not access subscription management",
          variant: "destructive",
        });
        return undefined;
      }

      return data.url;
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      return undefined;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        subscription,
        buildingUsage,
        refreshSubscription,
        signIn,
        signUp,
        signOut,
        createCheckoutSession,
        createCustomerPortalSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
