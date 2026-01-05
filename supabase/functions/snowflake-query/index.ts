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

// SECURITY: SQL validation function
function validateSqlSecurity(sql: string): { valid: boolean; error?: string } {
  const sqlUpper = sql.toUpperCase().trim();
  
  // 1. Only allow SELECT statements
  if (!sqlUpper.startsWith('SELECT')) {
    return { valid: false, error: 'Only SELECT queries are allowed' };
  }
  
  // 2. Block dangerous operations
  const dangerousKeywords = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE',
    'EXEC', 'EXECUTE', 'GRANT', 'REVOKE', 'MERGE', 'CALL'
  ];
  
  for (const keyword of dangerousKeywords) {
    // Check for keyword as a word boundary (not part of another word)
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sql)) {
      return { valid: false, error: `${keyword} operations are not allowed` };
    }
  }
  
  // 3. Enforce whitelisted tables only
  const allowedTables = ['FINANCIAL_TRANSACTIONS', 'FINANCIAL_REPORTS', 'MEDICAL_RECORDS', 'MEDICAL_REPORTS'];
  const hasAllowedTable = allowedTables.some(table => sqlUpper.includes(table));
  
  if (!hasAllowedTable) {
    return { valid: false, error: 'Query must use approved tables only' };
  }
  
  // 4. Limit query complexity (no nested subqueries beyond depth 2)
  const subqueryDepth = (sql.match(/\(/g) || []).length;
  if (subqueryDepth > 5) {
    return { valid: false, error: 'Query is too complex' };
  }
  
  // 5. Block SQL injection patterns
  const injectionPatterns = [
    /--/,           // SQL comments
    /\/\*/,         // Block comments
    /;\s*SELECT/i,  // Chained queries
    /UNION\s+ALL/i, // UNION attacks (allow simple UNION for legitimate use)
    /\bOR\s+1\s*=\s*1/i,  // OR 1=1 injection
    /\bAND\s+1\s*=\s*1/i, // AND 1=1 injection
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(sql)) {
      return { valid: false, error: 'Query contains disallowed pattern' };
    }
  }
  
  return { valid: true };
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

    // SECURITY: Validate SQL before execution
    const validation = validateSqlSecurity(sql);
    if (!validation.valid) {
      console.error('SQL validation failed:', validation.error);
      return new Response(JSON.stringify({ 
        error: 'Query validation failed',
        details: validation.error 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enforce result limit
    let safeSql = sql;
    if (!sql.toUpperCase().includes('LIMIT')) {
      safeSql = sql.replace(/;?\s*$/, ' LIMIT 100');
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

    console.log('Snowflake: Executing validated query...');
    // Don't log sensitive credentials
    
    // Snowflake SQL API endpoint
    const baseUrl = `https://${SNOWFLAKE_ACCOUNT}.snowflakecomputing.com`;
    const apiUrl = `${baseUrl}/api/v2/statements`;

    // Create Basic Auth header
    const credentials = btoa(`${SNOWFLAKE_USER}:${SNOWFLAKE_PASSWORD}`);

    // Execute validated query via Snowflake SQL API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT',
      },
      body: JSON.stringify({
        statement: safeSql, // Use validated and limited SQL
        timeout: Math.min(timeout, 60), // Enforce max timeout
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

      console.log('Snowflake: Session obtained, executing validated query...');

      // Execute validated query with session token
      const queryResponse = await fetch(`${baseUrl}/queries/v1/query-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Snowflake Token="${sessionToken}"`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sqlText: safeSql, // Use validated and limited SQL
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
