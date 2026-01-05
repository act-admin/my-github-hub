import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SnowflakeResponse {
  resultSetMetaData?: {
    numRows: number;
    format: string;
    rowType: Array<{ name: string; type: string }>;
  };
  data?: any[][];
  code?: string;
  message?: string;
  statementHandle?: string;
  statementStatusUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sql, timeout = 60 } = await req.json();
    
    if (!sql) {
      return new Response(JSON.stringify({ error: 'SQL query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Snowflake credentials from secrets
    const SNOWFLAKE_ACCOUNT = Deno.env.get('SNOWFLAKE_ACCOUNT');
    const SNOWFLAKE_USER = Deno.env.get('SNOWFLAKE_USER');
    const SNOWFLAKE_PASSWORD = Deno.env.get('SNOWFLAKE_PASSWORD');
    const SNOWFLAKE_WAREHOUSE = Deno.env.get('SNOWFLAKE_WAREHOUSE');
    const SNOWFLAKE_DATABASE = Deno.env.get('SNOWFLAKE_DATABASE');
    const SNOWFLAKE_SCHEMA = Deno.env.get('SNOWFLAKE_SCHEMA');

    if (!SNOWFLAKE_ACCOUNT || !SNOWFLAKE_USER || !SNOWFLAKE_PASSWORD) {
      console.error('Missing Snowflake credentials');
      return new Response(JSON.stringify({ 
        error: 'Snowflake credentials not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Snowflake: Executing query...');
    console.log('Snowflake: Account:', SNOWFLAKE_ACCOUNT);
    console.log('Snowflake: Database:', SNOWFLAKE_DATABASE);
    console.log('Snowflake: Schema:', SNOWFLAKE_SCHEMA);

    // Snowflake SQL API endpoint
    const baseUrl = `https://${SNOWFLAKE_ACCOUNT}.snowflakecomputing.com`;
    const apiUrl = `${baseUrl}/api/v2/statements`;

    // Create Basic Auth header
    const credentials = btoa(`${SNOWFLAKE_USER}:${SNOWFLAKE_PASSWORD}`);

    // Execute query via Snowflake SQL API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT',
      },
      body: JSON.stringify({
        statement: sql,
        timeout: timeout,
        database: SNOWFLAKE_DATABASE,
        schema: SNOWFLAKE_SCHEMA,
        warehouse: SNOWFLAKE_WAREHOUSE,
        role: 'PUBLIC',
      }),
    });

    const responseText = await response.text();
    console.log('Snowflake: Response status:', response.status);

    if (!response.ok) {
      console.error('Snowflake API error:', response.status, responseText);
      
      // Try alternative authentication approach using login API
      console.log('Snowflake: Trying session-based authentication...');
      
      // First, create a session
      const loginResponse = await fetch(`${baseUrl}/session/v1/login-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          data: {
            ACCOUNT_NAME: SNOWFLAKE_ACCOUNT,
            LOGIN_NAME: SNOWFLAKE_USER,
            PASSWORD: SNOWFLAKE_PASSWORD,
            CLIENT_APP_ID: 'SCODAC_NLQ',
            CLIENT_APP_VERSION: '1.0.0',
          },
        }),
      });

      if (!loginResponse.ok) {
        const loginError = await loginResponse.text();
        console.error('Snowflake login error:', loginResponse.status, loginError);
        return new Response(JSON.stringify({ 
          error: 'Failed to authenticate with Snowflake',
          details: loginError
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const loginData = await loginResponse.json();
      const sessionToken = loginData.data?.token;

      if (!sessionToken) {
        return new Response(JSON.stringify({ 
          error: 'Failed to get Snowflake session token'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Snowflake: Session obtained, executing query...');

      // Execute query with session token
      const queryResponse = await fetch(`${baseUrl}/queries/v1/query-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Snowflake Token="${sessionToken}"`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sqlText: sql,
          asyncExec: false,
          sequenceId: 1,
          querySubmissionTime: Date.now(),
        }),
      });

      if (!queryResponse.ok) {
        const queryError = await queryResponse.text();
        console.error('Snowflake query error:', queryResponse.status, queryError);
        return new Response(JSON.stringify({ 
          error: 'Failed to execute Snowflake query',
          details: queryError
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const queryData = await queryResponse.json();
      console.log('Snowflake: Query executed successfully');

      // Parse results
      const columns = queryData.data?.rowtype?.map((col: any) => col.name) || [];
      const rows = queryData.data?.rowset || [];
      
      const results = rows.map((row: any[]) => {
        const obj: Record<string, any> = {};
        columns.forEach((col: string, idx: number) => {
          obj[col] = row[idx];
        });
        return obj;
      });

      return new Response(JSON.stringify({
        success: true,
        columns,
        results,
        rowCount: results.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse successful response from SQL API
    let data: SnowflakeResponse;
    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(JSON.stringify({ 
        error: 'Failed to parse Snowflake response',
        raw: responseText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Snowflake: Query executed successfully');

    // Extract column names and data
    const columns = data.resultSetMetaData?.rowType?.map(col => col.name) || [];
    const rows = data.data || [];
    
    // Convert array rows to objects
    const results = rows.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    return new Response(JSON.stringify({
      success: true,
      columns,
      results,
      rowCount: data.resultSetMetaData?.numRows || results.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in snowflake-query function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
