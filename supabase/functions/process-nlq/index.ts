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

    // For general queries, use Azure OpenAI
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

    // Build system prompt for financial/data analysis
    systemPrompt = `You are an intelligent financial and data analytics assistant for SCODAC, a Clinical Decision Support System platform. 

Your capabilities include:
- Answering questions about financial data, transactions, and analytics
- Providing insights on accounts payable and accounts receivable
- Explaining financial metrics and trends
- Helping users understand their data and dashboards
- Generating SQL queries for Snowflake data warehouse when appropriate

When responding:
- Be concise but informative
- Use **bold** for important terms and numbers
- Format numbers with appropriate separators (e.g., $1,234,567.89)
- If the query relates to specific data, explain what data sources would be relevant
- Provide actionable insights when possible

Current context: User is working with financial and healthcare data systems including Snowflake data warehouse and Power BI dashboards.`;

    const apiUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
    
    console.log('Calling Azure OpenAI:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'api-key': AZURE_OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `Azure OpenAI error: ${response.status}`,
        query,
        summary: "I apologize, but I encountered an error while processing your query. Please try again or contact support if the issue persists.",
        sql: '',
        results: []
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Unable to generate response.';

    console.log('Azure OpenAI response received successfully');

    return new Response(JSON.stringify({
      query,
      message: 'snowflake_query',
      summary: aiResponse,
      sql: '',
      results: []
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
