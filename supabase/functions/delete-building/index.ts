
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Get the environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Initialize the Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  console.log("Delete building function called");
  
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(JSON.stringify({ error: 'Authorization header is required' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    // Extract the token from the authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    console.log(`User authenticated: ${user.id}`);

    // Parse the request body to get the building ID
    const requestData = await req.json();
    const buildingId = requestData.buildingId;
    
    if (!buildingId) {
      console.error("Missing buildingId in request");
      return new Response(JSON.stringify({ error: 'Building ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    console.log(`Attempting to delete building: ${buildingId}`);
    
    // First delete any associated notes with service role (bypassing RLS)
    try {
      console.log("Deleting associated building notes if any");
      const { error: notesDeleteError } = await supabase
        .from('building_notes')
        .delete()
        .eq('building_id', buildingId);
      
      if (notesDeleteError) {
        console.warn(`Error deleting associated notes (continuing anyway): ${notesDeleteError.message}`);
      }
    } catch (error) {
      console.warn("Error during notes deletion (continuing anyway):", error);
    }
    
    // Now directly delete the building using the service role (bypassing RLS)
    const { error: deleteError } = await supabase
      .from('buildings')
      .delete()
      .eq('id', buildingId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error(`Delete error: ${deleteError.message}`);
      return new Response(JSON.stringify({ error: 'Failed to delete building', details: deleteError.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    console.log("Building deleted successfully");
    return new Response(JSON.stringify({ success: true, message: 'Building deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error in delete-building function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});
