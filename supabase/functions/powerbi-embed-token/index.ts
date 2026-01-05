import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication helper - validates request authorization
async function authenticateRequest(req: Request): Promise<{ authenticated: boolean; userEmail?: string; error?: string }> {
  const authHeader = req.headers.get('authorization');
  const customAuthToken = req.headers.get('x-session-token');
  
  if (!authHeader) {
    return { authenticated: false, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Check if this is the Supabase anon key
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (token !== supabaseAnonKey) {
    // Try validating as a Supabase user JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { authenticated: false, error: 'Invalid authorization token' };
    }
    
    return { authenticated: true, userEmail: user.email };
  }
  
  // If using anon key, require custom session token
  if (!customAuthToken) {
    return { authenticated: false, error: 'Session authentication required' };
  }
  
  return { authenticated: true, userEmail: 'authenticated-user' };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Authenticate the request
    const authResult = await authenticateRequest(req);
    
    if (!authResult.authenticated) {
      console.error('Authentication failed:', authResult.error);
      return new Response(
        JSON.stringify({ error: authResult.error || 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('PowerBI: Authenticated user:', authResult.userEmail);

    const { reportId, groupId } = await req.json();
    
    if (!reportId) {
      return new Response(JSON.stringify({ error: 'reportId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Azure credentials from secrets
    const AZURE_CLIENT_ID = Deno.env.get('AZURE_CLIENT_ID');
    const AZURE_CLIENT_SECRET = Deno.env.get('AZURE_CLIENT_SECRET');
    const AZURE_TENANT_ID = Deno.env.get('AZURE_TENANT_ID');
    const POWERBI_WORKSPACE_ID = groupId || Deno.env.get('POWERBI_WORKSPACE_ID');

    if (!AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET || !AZURE_TENANT_ID) {
      console.error('Missing Azure credentials');
      return new Response(JSON.stringify({ 
        error: 'Azure credentials not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('PowerBI: Getting Azure AD access token...');

    // Step 1: Get Azure AD access token
    const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
    
    const tokenBody = new URLSearchParams({
      client_id: AZURE_CLIENT_ID,
      client_secret: AZURE_CLIENT_SECRET,
      scope: 'https://analysis.windows.net/powerbi/api/.default',
      grant_type: 'client_credentials',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Azure AD token error:', tokenResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to authenticate with Azure AD',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('PowerBI: Azure AD token obtained, generating embed token...');

    // Step 2: Generate Power BI embed token
    const embedTokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${POWERBI_WORKSPACE_ID}/reports/${reportId}/GenerateToken`;
    
    const embedTokenResponse = await fetch(embedTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessLevel: 'View',
        allowSaveAs: false,
      }),
    });

    if (!embedTokenResponse.ok) {
      const errorText = await embedTokenResponse.text();
      console.error('Power BI embed token error:', embedTokenResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to generate Power BI embed token',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const embedData = await embedTokenResponse.json();

    console.log('PowerBI: Embed token generated successfully');

    // Return embed configuration
    const embedUrl = `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${POWERBI_WORKSPACE_ID}`;
    
    return new Response(JSON.stringify({
      embedToken: embedData.token,
      embedUrl: embedUrl,
      reportId: reportId,
      expiration: embedData.expiration,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in powerbi-embed-token function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
