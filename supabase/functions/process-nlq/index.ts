import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64URL encode function
function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Function to create JWT for Snowflake key-pair auth
async function createSnowflakeJWT(account: string, user: string, privateKeyPem: string, publicKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiry
  
  // Extract account identifier (without region if using new format)
  // Account format could be: ACCOUNT-ORG or ACCOUNT.region
  const accountParts = account.toUpperCase().replace(/-/g, '_').split('.');
  const accountId = accountParts[0];
  const userUpper = user.toUpperCase();
  
  // Calculate public key fingerprint (SHA256 of DER-encoded public key)
  const pubKeyContents = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '');
  
  const pubKeyDer = Uint8Array.from(atob(pubKeyContents), c => c.charCodeAt(0));
  const hashBuffer = await crypto.subtle.digest('SHA-256', pubKeyDer);
  const hashArray = new Uint8Array(hashBuffer);
  const fingerprint = btoa(String.fromCharCode(...hashArray));
  
  // Qualified username format: ACCOUNT.USER.SHA256:FINGERPRINT
  const qualifiedUsername = `${accountId}.${userUpper}.SHA256:${fingerprint}`;
  
  console.log('JWT issuer:', qualifiedUsername);
  
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  
  const payload = {
    iss: qualifiedUsername,
    sub: `${accountId}.${userUpper}`,
    iat: now,
    exp: exp
  };
  
  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  
  // Import the private key
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  
  const signatureB64 = base64urlEncode(new Uint8Array(signature));
  
  return `${signingInput}.${signatureB64}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const queryLower = query.toLowerCase();
    
    // Detect query type for routing
    let message = '';
    
    // Check for Power BI dashboard requests
    if (queryLower.includes('financial dashboard') || queryLower.includes('finance dashboard') || 
        queryLower.includes('financial analytics') || queryLower.includes('show financial')) {
      message = 'powerbi_financial_dashboard';
      return new Response(JSON.stringify({
        query,
        message,
        summary: "I'm loading your **Financial Analytics Dashboard** powered by Power BI. This dashboard provides real-time insights into your financial performance, including revenue trends, expense analysis, and key financial metrics.",
        sql: '',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (queryLower.includes('medical dashboard') || queryLower.includes('healthcare dashboard') || 
        queryLower.includes('medical analytics') || queryLower.includes('patient dashboard')) {
      message = 'powerbi_medical_dashboard';
      return new Response(JSON.stringify({
        query,
        message,
        summary: "I'm loading your **Medical Analytics Dashboard** powered by Power BI. This dashboard provides comprehensive healthcare analytics including patient outcomes, treatment efficacy, and operational metrics.",
        sql: '',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check for GenAI Suite requests
    if (queryLower.includes('invoice') || queryLower.includes('accounts payable') || 
        queryLower.includes('ap automation') || queryLower.includes('vendor payment')) {
      message = 'genai_invoice_suite';
      return new Response(JSON.stringify({
        query,
        message,
        summary: "I'm loading your **Accounts Payable Automation Suite**. This intelligent dashboard helps you manage invoices, track approval workflows, and automate vendor payments.",
        sql: '',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (queryLower.includes('receivable') || queryLower.includes('accounts receivable') || 
        queryLower.includes('ar automation') || queryLower.includes('customer payment') || queryLower.includes('collections')) {
      message = 'genai_ar_suite';
      return new Response(JSON.stringify({
        query,
        message,
        summary: "I'm loading your **Accounts Receivable Automation Suite**. This intelligent dashboard helps you track customer payments, manage collections, and optimize your receivables process.",
        sql: '',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For general queries, use Azure OpenAI to generate SQL and get insights
    const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');
    const AZURE_OPENAI_DEPLOYMENT_NAME = Deno.env.get('AZURE_OPENAI_DEPLOYMENT_NAME') || 'gpt-4o';
    const AZURE_OPENAI_API_VERSION = Deno.env.get('AZURE_OPENAI_API_VERSION') || '2024-02-01';

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      console.error('Azure OpenAI credentials not configured');
      return new Response(JSON.stringify({ 
        error: 'Azure OpenAI not configured',
        query,
        summary: "I apologize, but I'm unable to process your query at the moment. The AI service is not properly configured. Please contact your administrator.",
        sql: '',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Detect if query is asking for data that requires SQL - expanded keyword list
    const dataKeywords = [
      'show', 'list', 'get', 'find', 'how many', 'count', 'total', 'sum', 'average', 
      'top', 'bottom', 'highest', 'lowest', 'transactions', 'records', 'data',
      'revenue', 'sales', 'expenses', 'profit', 'balance', 'customers', 'orders',
      'patients', 'claims', 'payments', 'vendors', 'amount', 'compare', 'comparison',
      'cost', 'costs', 'treatment', 'medical', 'financial', 'report', 'reports',
      'asthma', 'arthritis', 'diagnosis', 'health', 'what', 'which', 'query',
      'select', 'table', 'tables', 'columns', 'all', 'give', 'fetch', 'display'
    ];
    
    const isDataQuery = dataKeywords.some(keyword => queryLower.includes(keyword));

    // Schema context for SQL generation - using actual FINANCIAL_DEMO.PUBLIC tables
    const schemaContext = `
You have access to a Snowflake data warehouse with the following schema:

Database: FINANCIAL_DEMO
Schema: PUBLIC

Tables available:
- FINANCIAL_REPORTS - Contains financial report data (reports, summaries, financial statements)
- FINANCIAL_TRANSACTIONS - Contains all financial transactions (transaction records, amounts, dates, types)
- MEDICAL_RECORDS - Contains patient medical records (patient data, treatments, diagnoses)
- MEDICAL_REPORTS - Contains medical reports and analytics (healthcare metrics, outcomes)

When generating SQL:
- Use proper Snowflake SQL syntax
- Always use fully qualified table names: FINANCIAL_DEMO.PUBLIC.TABLE_NAME
- Limit results to 100 rows unless user specifies otherwise
- Use appropriate aggregations and groupings
- Format dates properly
- Use SELECT * to explore table structure if unsure about columns
`;

    let sqlQuery = '';
    let queryResults: any[] = [];
    let aiSummary = '';

    if (isDataQuery) {
      // Step 1: Generate SQL using Azure OpenAI
      console.log('Generating SQL query with Azure OpenAI...');
      
      const sqlSystemPrompt = `You are a SQL expert for Snowflake data warehouse. Generate ONLY the SQL query, no explanations.
${schemaContext}

Rules:
- Return ONLY the SQL query, nothing else
- Do not include markdown code blocks
- Ensure the query is valid Snowflake SQL
- Always limit to 100 rows unless specified
- Use proper date formatting`;

      const sqlApiUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
      
      const sqlResponse = await fetch(sqlApiUrl, {
        method: 'POST',
        headers: {
          'api-key': AZURE_OPENAI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: sqlSystemPrompt },
            { role: 'user', content: `Generate a SQL query for: ${query}` }
          ],
          max_tokens: 500,
          temperature: 0,
        }),
      });

      if (sqlResponse.ok) {
        const sqlData = await sqlResponse.json();
        sqlQuery = sqlData.choices?.[0]?.message?.content?.trim() || '';
        
        // Clean up SQL if it has markdown
        sqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
        
        console.log('Generated SQL:', sqlQuery);

        // Step 2: Execute SQL against Snowflake using JWT key-pair auth
        if (sqlQuery) {
          try {
            const SNOWFLAKE_ACCOUNT = Deno.env.get('SNOWFLAKE_ACCOUNT');
            const SNOWFLAKE_USER = Deno.env.get('SNOWFLAKE_USER');
            const SNOWFLAKE_PRIVATE_KEY = Deno.env.get('SNOWFLAKE_PRIVATE_KEY');
            const SNOWFLAKE_PUBLIC_KEY = Deno.env.get('SNOWFLAKE_PUBLIC_KEY');
            const SNOWFLAKE_WAREHOUSE = Deno.env.get('SNOWFLAKE_WAREHOUSE');

            if (SNOWFLAKE_ACCOUNT && SNOWFLAKE_USER && SNOWFLAKE_PRIVATE_KEY && SNOWFLAKE_PUBLIC_KEY) {
              console.log('Executing query against Snowflake SQL API with key-pair auth...');
              console.log('Account:', SNOWFLAKE_ACCOUNT);
              console.log('User:', SNOWFLAKE_USER);
              
              try {
                // Create JWT token for authentication
                const jwt = await createSnowflakeJWT(SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, SNOWFLAKE_PRIVATE_KEY, SNOWFLAKE_PUBLIC_KEY);
                console.log('JWT created successfully');
                
                // Use Snowflake SQL API
                const baseUrl = `https://${SNOWFLAKE_ACCOUNT}.snowflakecomputing.com`;
                const sqlApiEndpoint = `${baseUrl}/api/v2/statements`;
                
                console.log('Executing SQL via SQL API...');
                
                const queryResponse = await fetch(sqlApiEndpoint, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${jwt}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT'
                  },
                  body: JSON.stringify({
                    statement: sqlQuery,
                    warehouse: SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
                    database: 'FINANCIAL_DEMO',
                    schema: 'PUBLIC',
                    timeout: 60
                  }),
                });

                console.log('Snowflake query response status:', queryResponse.status);
                
                if (queryResponse.ok) {
                  const queryData = await queryResponse.json();
                  console.log('Snowflake response received');
                  
                  // Handle the Snowflake SQL API response format
                  if (queryData.data && Array.isArray(queryData.data)) {
                    const columns = queryData.resultSetMetaData?.rowType?.map((col: any) => col.name) || [];
                    queryResults = queryData.data.map((row: any[]) => {
                      const obj: Record<string, any> = {};
                      columns.forEach((col: string, idx: number) => {
                        obj[col] = row[idx];
                      });
                      return obj;
                    });
                    console.log(`Snowflake returned ${queryResults.length} rows`);
                  } else if (queryData.statementHandle) {
                    // Async query - need to poll for results
                    console.log('Query submitted, statement handle:', queryData.statementHandle);
                    
                    // Poll for results
                    const statusUrl = `${sqlApiEndpoint}/${queryData.statementHandle}`;
                    let attempts = 0;
                    const maxAttempts = 30;
                    
                    while (attempts < maxAttempts) {
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
                      const statusResponse = await fetch(statusUrl, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${jwt}`,
                          'Accept': 'application/json',
                          'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT'
                        },
                      });
                      
                      if (statusResponse.ok) {
                        const statusData = await statusResponse.json();
                        
                        if (statusData.statementStatusUrl) {
                          console.log('Query still running...');
                          attempts++;
                          continue;
                        }
                        
                        if (statusData.data && Array.isArray(statusData.data)) {
                          const columns = statusData.resultSetMetaData?.rowType?.map((col: any) => col.name) || [];
                          queryResults = statusData.data.map((row: any[]) => {
                            const obj: Record<string, any> = {};
                            columns.forEach((col: string, idx: number) => {
                              obj[col] = row[idx];
                            });
                            return obj;
                          });
                          console.log(`Snowflake returned ${queryResults.length} rows`);
                          break;
                        }
                      } else {
                        console.error('Status check failed:', statusResponse.status);
                        break;
                      }
                      
                      attempts++;
                    }
                  }
                } else {
                  const errorText = await queryResponse.text();
                  console.error('Snowflake query failed:', queryResponse.status, errorText);
                }
              } catch (jwtError) {
                console.error('JWT/Query error:', jwtError);
              }
            } else {
              console.error('Missing Snowflake credentials for key-pair auth');
              console.log('Has account:', !!SNOWFLAKE_ACCOUNT);
              console.log('Has user:', !!SNOWFLAKE_USER);
              console.log('Has private key:', !!SNOWFLAKE_PRIVATE_KEY);
              console.log('Has public key:', !!SNOWFLAKE_PUBLIC_KEY);
            }
          } catch (snowflakeError) {
            console.error('Snowflake error:', snowflakeError);
          }
        }
      }
    }

    // Step 3: Generate natural language summary with Azure OpenAI
    console.log('Generating AI summary...');
    
    const summarySystemPrompt = `You are an intelligent financial and data analytics assistant for SCODAC.

Your capabilities include:
- Answering questions about financial data and analytics
- Providing insights on accounts payable and receivable
- Explaining financial metrics and trends
- Summarizing query results in a clear, actionable way

When responding:
- Be concise but informative
- Use **bold** for important terms and numbers
- Format numbers with appropriate separators (e.g., $1,234,567.89)
- Provide actionable insights when possible
- If data was retrieved, summarize the key findings`;

    let userMessage = query;
    if (queryResults.length > 0) {
      userMessage = `User query: ${query}\n\nData retrieved (${queryResults.length} rows):\n${JSON.stringify(queryResults.slice(0, 10), null, 2)}\n\nPlease summarize these results for the user.`;
    } else if (sqlQuery) {
      userMessage = `User query: ${query}\n\nI generated this SQL query: ${sqlQuery}\n\nHowever, I couldn't connect to the database at this time. Please explain what data this query would retrieve and how it would answer the user's question.`;
    }

    const summaryApiUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
    
    const summaryResponse = await fetch(summaryApiUrl, {
      method: 'POST',
      headers: {
        'api-key': AZURE_OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: summarySystemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text();
      console.error('Azure OpenAI error:', summaryResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: `Azure OpenAI error: ${summaryResponse.status}`,
        query,
        summary: "I apologize, but I encountered an error while processing your query. Please try again.",
        sql: sqlQuery,
        results: queryResults
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const summaryData = await summaryResponse.json();
    aiSummary = summaryData.choices?.[0]?.message?.content || 'Unable to generate summary.';

    console.log('Azure OpenAI response received successfully');

    return new Response(JSON.stringify({
      query,
      message: 'snowflake_query',
      summary: aiSummary,
      sql: sqlQuery,
      results: queryResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-nlq function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      summary: "I apologize, but I encountered an unexpected error. Please try again.",
      sql: '',
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
