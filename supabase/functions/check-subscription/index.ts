
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { stripe } from '../_shared/stripe.ts';

// Get the environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Initialize the Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
      status: 204,
    });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header is required' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Extract the token from the authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get the user's subscription data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_end_date')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve profile', details: profileError.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get the tier limits
    const { data: tierData, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', profile.subscription_tier)
      .single();

    if (tierError) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve subscription tier', details: tierError.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get the current month in format YYYY-MM
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get the user's building counts for this month
    const { data: buildingCounts, error: countError } = await supabase
      .from('user_building_counts')
      .select('buildings_created_this_month')
      .eq('user_id', user.id)
      .eq('current_month', currentMonth)
      .maybeSingle(); // Use maybeSingle instead of single to handle cases where no row exists yet

    // Get the total number of buildings for this user
    const { count: totalBuildings, error: buildingError } = await supabase
      .from('buildings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Prepare the response
    const response = {
      subscription: {
        tier: profile.subscription_tier,
        status: profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date() ? 'expired' : 'active',
        end_date: profile.subscription_end_date,
        is_trial: false, // Set based on your business logic
      },
      buildings: {
        total: totalBuildings || 0,
        monthly: buildingCounts?.buildings_created_this_month || 0,
        limits: {
          total: tierData.max_buildings,
          monthly: tierData.max_new_buildings_per_month,
        },
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
