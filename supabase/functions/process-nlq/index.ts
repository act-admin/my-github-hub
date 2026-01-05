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
    let systemPrompt = '';
    
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
    
    // Get Snowflake config for context
    const SNOWFLAKE_DATABASE = Deno.env.get('SNOWFLAKE_DATABASE') || 'financial_demo';
    const SNOWFLAKE_SCHEMA = Deno.env.get('SNOWFLAKE_SCHEMA') || 'public';

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

    // Detect if query is asking for data that requires SQL
    const dataKeywords = ['show', 'list', 'get', 'find', 'how many', 'count', 'total', 'sum', 'average', 
                          'top', 'bottom', 'highest', 'lowest', 'transactions', 'records', 'data',
                          'revenue', 'sales', 'expenses', 'profit', 'balance', 'customers', 'orders',
                          'patients', 'claims', 'payments', 'vendors', 'amount'];
    
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

        // Step 2: Execute SQL against Snowflake
        if (sqlQuery) {
          try {
            const SNOWFLAKE_ACCOUNT = Deno.env.get('SNOWFLAKE_ACCOUNT');
            const SNOWFLAKE_USER = Deno.env.get('SNOWFLAKE_USER');
            const SNOWFLAKE_PASSWORD = Deno.env.get('SNOWFLAKE_PASSWORD');
            const SNOWFLAKE_WAREHOUSE = Deno.env.get('SNOWFLAKE_WAREHOUSE');

            if (SNOWFLAKE_ACCOUNT && SNOWFLAKE_USER && SNOWFLAKE_PASSWORD) {
              console.log('Executing query against Snowflake...');
              
              const baseUrl = `https://${SNOWFLAKE_ACCOUNT}.snowflakecomputing.com`;
              
              // Try session-based authentication
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

              if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                const sessionToken = loginData.data?.token;

                if (sessionToken) {
                  const queryResponse = await fetch(`${baseUrl}/queries/v1/query-request`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Snowflake Token="${sessionToken}"`,
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                      sqlText: sqlQuery,
                      asyncExec: false,
                      sequenceId: 1,
                    }),
                  });

                  if (queryResponse.ok) {
                    const queryData = await queryResponse.json();
                    const columns = queryData.data?.rowtype?.map((col: any) => col.name) || [];
                    const rows = queryData.data?.rowset || [];
                    
                    queryResults = rows.map((row: any[]) => {
                      const obj: Record<string, any> = {};
                      columns.forEach((col: string, idx: number) => {
                        obj[col] = row[idx];
                      });
                      return obj;
                    });

                    console.log(`Snowflake returned ${queryResults.length} rows`);
                  } else {
                    console.log('Snowflake query failed, using mock data');
                  }
                }
              } else {
                console.log('Snowflake login failed, will generate summary without data');
              }
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
