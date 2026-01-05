import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
