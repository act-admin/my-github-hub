from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import random
import re
import sys
import requests
from openai import AzureOpenAI

# Add the server directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the existing NLQ processing logic
from main import process_nlq

# Initialize Azure OpenAI client (optional - only if credentials are available)
openai_client = None
azure_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
azure_api_key = os.getenv('AZURE_OPENAI_API_KEY')

if azure_endpoint and azure_api_key:
    try:
        openai_client = AzureOpenAI(
            api_key=azure_api_key,
            api_version=os.getenv('AZURE_OPENAI_API_VERSION', '2024-12-01-preview'),
            azure_endpoint=azure_endpoint
        )
        print("✅ Azure OpenAI client initialized in Flask app")
    except Exception as e:
        print(f"⚠️  Failed to initialize Azure OpenAI client: {e}")
else:
    print("⚠️  Azure OpenAI credentials not configured - AI features will be limited")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- Sentiment Analysis Function ---
def analyze_sentiment(query: str) -> str:
    """
    Analyzes the sentiment of a given query using a simple keyword-based approach.
    Can be extended with a more sophisticated NLP model.
    """
    query_lower = query.lower()
    positive_keywords = ['great', 'love', 'perfect', 'excellent', 'good', 'thank you', 'helpful', 'awesome']
    negative_keywords = ['terrible', 'hate', 'bad', 'poor', 'buggy', 'slow', 'not working', 'issue', 'problem', 'difficult']

    if any(keyword in query_lower for keyword in positive_keywords):
        return 'positive'
    elif any(keyword in query_lower for keyword in negative_keywords):
        return 'negative'
    else:
        return 'neutral'
# --- End Sentiment Analysis Function ---


def create_human_readable_summary(query: str, results_text: str) -> str:
    """
    Generate conversational AI responses using OpenAI GPT for natural language responses.
    """
    try:
        # Handle multi-line results (like year-by-year breakdowns)
        if '\n' in results_text:
            lines = results_text.strip().split('\n')
            if len(lines) > 1 and '|' in results_text:
                # Format multi-line data for better context
                formatted_data = ""
                for line in lines:
                    if '|' in line:
                        parts = [p.strip() for p in line.split('|')]
                        if len(parts) == 2:
                            year, amount = parts
                            if year.isdigit() and len(year) == 4:
                                formatted_data += f"Year {year}: ${amount}\n"
                            else:
                                formatted_data += f"{year}: ${amount}\n"
                results_context = f"Multi-year data:\n{formatted_data}"
            else:
                results_context = f"Results: {results_text}"
        else:
            # Single value results
            try:
                value = float(results_text.replace(',', ''))
                formatted_value = f"${value:,.2f}" if value >= 0 else f"-${abs(value):,.2f}"
                results_context = f"Result: {formatted_value}"
            except:
                results_context = f"Result: {results_text}"

        # Check if OpenAI client is available
        if openai_client is None:
            try:
                value = float(results_text.replace(',', ''))
                formatted_value = f"${value:,.2f}" if value >= 0 else f"-${abs(value):,.2f}"
                return f"Based on your query, the result is {formatted_value}."
            except:
                return f"Based on your query, the result is {results_text}."

        # Generate conversational response using Azure OpenAI
        response = openai_client.chat.completions.create(
            model=os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'cdss-openai'),
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional AI assistant helping with financial and medical data analysis. Generate natural, conversational responses that are well-structured and visually appealing. Use bullet points, numbered lists, and clear formatting when presenting data. Always be helpful, concise, and provide insights. Format currency properly for financial data and medical costs. Be conversational but professional. Structure your responses with:\n\n• Key findings as bullet points\n• Clear insights and analysis\n• Easy-to-scan formatting\n• Professional but friendly tone\n\nMake the data easy to understand and visually appealing."
                },
                {
                    "role": "user",
                    "content": f"User asked: '{query}'\n\nData found: {results_context}\n\nPlease provide a natural, conversational response explaining this result. Keep it concise but informative, and make it sound like you're having a friendly conversation about the data."
                }
            ],
            temperature=0.7,
            max_tokens=200
        )

        ai_response = response.choices[0].message.content
        return ai_response.strip() if ai_response else "I couldn't generate a response at the moment."

    except Exception as e:
        print(f"OpenAI API error: {e}", flush=True)
        # Fallback to a simple response if OpenAI fails
        try:
            value = float(results_text.replace(',', ''))
            formatted_value = f"${value:,.2f}" if value >= 0 else f"-${abs(value):,.2f}"
            return f"Based on your query, the result is {formatted_value}."
        except:
            return f"Based on your query, the result is {results_text}."

@app.route('/api/process-nlq', methods=['POST'])
def process_nlq_endpoint():
    """
    API endpoint for processing natural language queries
    """
    try:
        # Get the JSON data from the request
        data = request.get_json(silent=True)
        if not data:
            data = {}

        if not data or 'query' not in data:
            return jsonify({
                'error': 'Missing query parameter',
                'query': '',
                'sql': '',
                'results': []
            }), 400

        nlq = data['query']
        print(f"Processing NLQ via API: {nlq}", flush=True)

        # Process the query using existing logic
        result = process_nlq(nlq)
        print(f"Raw result from process_nlq: {result}", flush=True)

        # Check for GenAI Suite Invoice response
        if result == "genai_invoice_suite":
            # Fetch real invoice data from Node.js endpoint
            try:
                # Detect if user is asking about a specific status or vendor
                status_filter = None
                vendor_filter = None
                nlq_lower = nlq.lower()

                # Status filters
                if 'pending approval' in nlq_lower or 'awaiting approval' in nlq_lower:
                    status_filter = 'pending approval'
                elif 'exception' in nlq_lower:
                    status_filter = 'exception'
                elif 'posted' in nlq_lower:
                    status_filter = 'posted'
                elif 'validating' in nlq_lower:
                    status_filter = 'validating'

                # Vendor filters (AP vendors)
                if 'tech solutions' in nlq_lower:
                    vendor_filter = 'Tech Solutions'
                elif 'global tech' in nlq_lower:
                    vendor_filter = 'Global Tech'
                elif 'office supplies' in nlq_lower:
                    vendor_filter = 'Office Supplies'
                elif 'cloud services' in nlq_lower:
                    vendor_filter = 'Cloud Services'
                elif 'consulting partners' in nlq_lower:
                    vendor_filter = 'Consulting Partners'

                # Build API params - always set type to payable for AP requests
                params = {'type': 'payable'}
                if status_filter:
                    params['status'] = status_filter
                if vendor_filter:
                    params['vendor'] = vendor_filter

                print(f"AP API request params: {params}", flush=True)
                invoice_data_response = requests.get('http://localhost:5000/api/genai-invoices', params=params, timeout=5)
                invoice_data = invoice_data_response.json()
                print(f"AP API response: {invoice_data}", flush=True)

                # Format invoice data for the AI
                invoices = invoice_data.get('invoices', [])
                summary = invoice_data.get('summary', {})

                # Build invoice data string for AI
                invoice_details = ""
                for inv in invoices:
                    invoice_details += f"• {inv['vendor']} - Invoice ID: {inv['id']} - Amount: ${inv['amount']:,.2f} - Due: {inv['dueDate']}\n"

                # Detect if this is an action request (approve, reject, update, change)
                is_action_request = any(word in nlq_lower for word in ['approve', 'reject', 'update', 'change status', 'modify'])

                # Generate AI-powered response with real invoice data
                if openai_client is None:
                    ai_summary = f"**Invoice Summary**\n\nFound {summary['count']} invoices totaling ${summary['total']:,.2f}.\n\n{invoice_details}\n\nView details in GenAI Suite dashboard below."
                else:
                    if is_action_request:
                        # Get today's date for approval date
                        from datetime import datetime
                        today = datetime.now().strftime('%Y-%m-%d')

                        # For action requests, show detailed success confirmation
                        invoice_response = openai_client.chat.completions.create(
                            model=os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'cdss-openai'),
                            messages=[
                                {
                                    "role": "system",
                                    "content": f"""You are an AI assistant for accounts payable. For approval requests, provide a detailed success confirmation.

FORMAT FOR APPROVAL CONFIRMATION:
Show approval success details professionally with all relevant information.

EXAMPLE:
**Invoice Approved Successfully ✓**

**Invoice ID**: INV-24-5848 (Tech Solutions Ltd.)
**Status Changed**: Pending Approval → APPROVED
**Invoice Amount**: $15,800.00
**Approval Method**: Manager Approval
**Approval Date**: {today}

**Payment Update**: Invoice has been queued for payment processing. Payment will be processed within 2-3 business days. Vendor notification email sent automatically.

View complete details in GenAI Suite dashboard below."""
                                },
                                {
                                    "role": "user",
                                    "content": f"User asked: '{nlq}'\n\nInvoice:\n{invoice_details}\n\nGenerate a detailed approval success confirmation showing invoice ID, vendor, status change, invoice amount, approval method (Manager Approval), approval date ({today}), and payment update message. Make it look professional and complete."
                                }
                            ],
                            temperature=0.7,
                            max_tokens=250
                        )
                    else:
                        # For viewing queries, keep concise format
                        invoice_response = openai_client.chat.completions.create(
                            model=os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'cdss-openai'),
                            messages=[
                                {
                                    "role": "system",
                                    "content": """You are an AI assistant for invoice information. Provide CONCISE responses.

FORMAT:
**Status**: **Count** totaling **$Amount**
• **Vendor** - **Invoice ID** - **$Amount** - Due: Date

View details in GenAI Suite dashboard below."""
                                },
                                {
                                    "role": "user",
                                    "content": f"User asked: '{nlq}'\n\nInvoice Data:\n{invoice_details}\n\nTotal: {summary['count']} invoices, ${summary['total']:,.2f}\n\nProvide a concise response (3-4 lines) with bullet points and bold for key info."
                                }
                            ],
                            temperature=0.7,
                            max_tokens=150
                        )
                    ai_summary = invoice_response.choices[0].message.content.strip() if invoice_response.choices[0].message.content else ""

            except Exception as e:
                print(f"Error fetching or processing invoice data: {e}", flush=True)
                ai_summary = "**Invoice Information**\n\nTo view your invoice details including IDs, amounts, statuses, and vendor information, please access the GenAI Suite dashboard below."

            return jsonify({
                'query': nlq,
                'message': 'genai_invoice_suite',
                'summary': ai_summary,
                'sql': '',
                'results': []
            })

        # Check for GenAI Suite AR (Accounts Receivable) response
        if result == "genai_ar_suite":
            # Fetch real AR invoice data from Node.js endpoint
            try:
                # Detect if user is asking about a specific status or customer
                status_filter = None
                customer_filter = None
                nlq_lower = nlq.lower()

                # Check if this is an action request first (more flexible matching)
                is_action_request = (
                    ('change' in nlq_lower and 'status' in nlq_lower) or
                    ('update' in nlq_lower and 'status' in nlq_lower) or
                    ('mark as' in nlq_lower) or
                    ('set' in nlq_lower and 'status' in nlq_lower)
                )

                # Status filters for AR (but NOT for action requests targeting that status)
                if not is_action_request:
                    if 'overdue' in nlq_lower:
                        status_filter = 'overdue'
                    elif 'disputed' in nlq_lower:
                        status_filter = 'disputed'
                    elif 'paid' in nlq_lower:
                        status_filter = 'paid'
                    elif 'pending' in nlq_lower:
                        status_filter = 'pending'

                # Customer filters (always apply)
                if 'manufacturing plus' in nlq_lower:
                    customer_filter = 'Manufacturing Plus'
                elif 'techcorp' in nlq_lower or 'tech corp' in nlq_lower:
                    customer_filter = 'TechCorp'
                elif 'global retailers' in nlq_lower:
                    customer_filter = 'Global Retailers'
                elif 'service dynamics' in nlq_lower:
                    customer_filter = 'Service Dynamics'

                # Build API URL with filters using params dict (safer than manual string building)
                params = {'type': 'receivable'}
                if status_filter:
                    params['status'] = status_filter
                if customer_filter:
                    params['customer'] = customer_filter

                print(f"AR API request params: {params}", flush=True)
                invoice_data_response = requests.get('http://localhost:5000/api/genai-invoices', params=params, timeout=5)
                invoice_data = invoice_data_response.json()
                print(f"AR API response: {invoice_data}", flush=True)

                # Format AR invoice data for the AI
                invoices = invoice_data.get('invoices', [])
                summary = invoice_data.get('summary', {})
                print(f"AR invoices count: {len(invoices)}", flush=True)

                # Build AR invoice data string for AI
                invoice_details = ""

                # For action requests without a specific customer filter, prioritize overdue/pending invoices
                if is_action_request and not customer_filter and len(invoices) > 0:
                    # Sort to prioritize: overdue > pending > disputed > paid
                    status_priority = {'overdue': 0, 'pending': 1, 'disputed': 2, 'paid': 3}
                    invoices_sorted = sorted(invoices, key=lambda x: status_priority.get(x.get('status', 'paid'), 4))
                    # Use only the first (most relevant) invoice for action requests
                    invoices = invoices_sorted[:1]

                for inv in invoices:
                    invoice_details += f"• {inv['customer']} - Invoice ID: {inv['id']} - Amount: ${inv['amount']:,.2f} - Due: {inv['dueDate']} - Status: {inv['status']}\n"

                print(f"AR invoice_details for AI: {invoice_details}", flush=True)
                print(f"AR is_action_request: {is_action_request}", flush=True)

                # Generate AI-powered response with real AR invoice data
                if openai_client is None:
                    ai_summary = f"**AR Invoice Summary**\n\nFound {summary['count']} invoices totaling ${summary['total']:,.2f}.\n\n{invoice_details}\n\nView details in GenAI Suite dashboard below."
                else:
                    if is_action_request:
                        # Get today's date for payment date
                        from datetime import datetime
                        today = datetime.now().strftime('%Y-%m-%d')

                        # For action requests, show detailed success confirmation
                        invoice_response = openai_client.chat.completions.create(
                            model=os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'cdss-openai'),
                            messages=[
                                {
                                    "role": "system",
                                    "content": f"""You are an AI assistant for accounts receivable. For status change requests, provide a detailed success confirmation.

FORMAT FOR STATUS CHANGE CONFIRMATION:
Show payment success details professionally with all relevant information.

EXAMPLE:
**Payment Status Updated Successfully ✓**

**Invoice ID**: INV-AR-24-2848 (Manufacturing Plus)
**Status Changed**: Overdue → PAID
**Payment Amount**: $18,900.00
**Payment Method**: Wire Transfer
**Payment Date**: {today}

**Account Update**: Manufacturing Plus account balance is now $0.00. Customer maintains excellent payment rating. Automatic thank you email sent to customer contact.

View complete details in GenAI Suite dashboard below."""
                                },
                                {
                                    "role": "user",
                                    "content": f"User asked: '{nlq}'\n\nInvoice:\n{invoice_details}\n\nGenerate a detailed payment success confirmation showing invoice ID, customer, status change, payment amount, payment method (Wire Transfer), payment date ({today}), and account update message. Make it look professional and complete."
                                }
                            ],
                            temperature=0.7,
                            max_tokens=250
                        )
                    else:
                        # For viewing queries, keep concise format
                        invoice_response = openai_client.chat.completions.create(
                            model=os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'cdss-openai'),
                            messages=[
                                {
                                    "role": "system",
                                    "content": """You are an AI assistant for accounts receivable information. Provide CONCISE responses.

FORMAT:
**Status**: **Count** totaling **$Amount**
• **Customer** - **Invoice ID** - **$Amount** - Due: Date

View details in GenAI Suite dashboard below."""
                                },
                                {
                                    "role": "user",
                                    "content": f"User asked: '{nlq}'\n\nAR Invoice Data:\n{invoice_details}\n\nTotal: {summary['count']} invoices, ${summary['total']:,.2f}\n\nProvide a concise response (3-4 lines) with bullet points and bold for key info."
                                }
                            ],
                            temperature=0.7,
                            max_tokens=150
                        )
                    ai_summary = invoice_response.choices[0].message.content.strip() if invoice_response.choices[0].message.content else ""

            except Exception as e:
                print(f"Error fetching or processing AR invoice data: {e}", flush=True)
                ai_summary = "**Accounts Receivable Information**\n\nTo view your AR invoice details including IDs, amounts, statuses, and customer information, please access the GenAI Suite dashboard below."

            return jsonify({
                'query': nlq,
                'message': 'genai_ar_suite',
                'summary': ai_summary,
                'sql': '',
                'results': []
            })

        # Check for Power BI dashboard special responses
        if result == "powerbi_financial_dashboard":
            return jsonify({
                'query': nlq,
                'message': 'powerbi_financial_dashboard',
                'summary': 'Processing your financial report...',
                'sql': '',
                'results': []
            })

        if result == "powerbi_medical_dashboard":
            return jsonify({
                'query': nlq,
                'message': 'powerbi_medical_dashboard',
                'summary': 'Processing your medical report...',
                'sql': '',
                'results': []
            })

        # Legacy support for old powerbi_dashboard response
        if result == "powerbi_dashboard":
            return jsonify({
                'query': nlq,
                'message': 'powerbi_financial_dashboard',
                'summary': 'Processing your financial report...',
                'sql': '',
                'results': []
            })

        # Parse the result to extract components
        if "Error:" in result:
            return jsonify({
                'error': result,
                'query': nlq,
                'sql': '',
                'results': []
            }), 500

        # For structured queries, extract numeric results (NEW FORMAT)
        if "(Source: Structured - financial_transactions)" in result or "(Source: Structured - medical_records)" in result:
            # Extract the deterministic result portion
            if "(Source: Structured - financial_transactions)" in result:
                results_text = result.split(" (Source: Structured - financial_transactions)")[0].strip()
            else:
                results_text = result.split(" (Source: Structured - medical_records)")[0].strip()
            print(f"Extracted structured results: {results_text}")

            # Create human-readable summary based on query type and results
            human_readable_summary = create_human_readable_summary(nlq, results_text)
            print(f"Human-readable summary: {human_readable_summary}")

            # Format as structured results for frontend
            try:
                # Parse multi-line results (e.g., "2025 | 3000.00\n2026 | 4000.50")
                if '\n' in results_text:
                    lines = results_text.strip().split('\n')
                    formatted_results = []
                    for line in lines:
                        if '|' in line:
                            parts = [p.strip() for p in line.split('|')]
                            row_data = {}
                            for i, part in enumerate(parts):
                                row_data[f"column_{i}"] = part
                            formatted_results.append(row_data)
                        else:
                            formatted_results.append({"value": line.strip()})
                else:
                    # Single value result
                    formatted_results = [{"value": results_text}]

                print(f"Formatted structured results: {formatted_results}")
            except Exception as e:
                print(f"Error formatting results: {e}")
                formatted_results = [{"value": results_text}]

            return jsonify({
                'query': nlq,
                'sql': 'Generated SQL query',
                'results': formatted_results,
                'summary': human_readable_summary,
                'message': result
            })

        # For PDF queries (new)
        elif "Analysis (Source: PDF Documents)" in result:
            print(f"Processing PDF result: {result}")
            analysis_text = result.split("Analysis (Source: PDF Documents): ")[1]
            print(f"Extracted PDF analysis text: {analysis_text}")
            return jsonify({
                'query': nlq,
                'sql': '',
                'results': [],
                'summary': analysis_text,
                'message': result
            })

        # For structured queries with analysis (new OpenAI analysis)
        elif "Analysis (Source: Structured" in result:
            print(f"Processing structured analysis result: {result}")
            if "financial_transactions" in result:
                analysis_text = result.split("Analysis (Source: Structured - financial_transactions): ")[1]
            else:
                analysis_text = result.split("Analysis (Source: Structured - medical_records): ")[1]
            print(f"Extracted analysis text: {analysis_text}")
            return jsonify({
                'query': nlq,
                'sql': '',
                'results': [],
                'summary': analysis_text,
                'message': result
            })

        # For unstructured queries (summaries) - both single and consolidated
        elif "Summary (Source: Unstructured" in result:
            print(f"Processing unstructured query result: {result}")
            # Handle both regular and consolidated summaries
            if "Consolidated" in result:
                if "financial_reports" in result:
                    summary_text = result.split("Summary (Source: Unstructured - financial_reports, Consolidated ")[1].split("): ", 1)[1]
                else:
                    summary_text = result.split("Summary (Source: Unstructured - medical_reports, Consolidated ")[1].split("): ", 1)[1]
            else:
                if "financial_reports" in result:
                    summary_text = result.split("Summary (Source: Unstructured - financial_reports): ")[1]
                else:
                    summary_text = result.split("Summary (Source: Unstructured - medical_reports): ")[1]
            print(f"Extracted summary text: {summary_text}")
            return jsonify({
                'query': nlq,
                'sql': '',
                'results': [],
                'summary': summary_text,
                'message': result
            })

        # Default response
        return jsonify({
            'query': nlq,
            'sql': '',
            'results': [],
            'message': result
        })

    except Exception as e:
        print(f"API Error: {e}")
        query_value = ''
        if 'data' in dir() and data is not None and isinstance(data, dict):
            query_value = data.get('query', '')
        return jsonify({
            'error': f'Internal server error: {str(e)}',
            'query': query_value,
            'sql': '',
            'results': []
        }), 500

# --- Dashboard API Endpoints ---
@app.route('/api/dashboard/chat-history')
def get_chat_history():
    persona = request.args.get('persona', 'finance-accounting')
    limit = int(request.args.get('limit', 10))

    # Mock chat history data
    avatars = ["👨‍💼", "👩‍💼", "👨‍💻", "👩‍🔬", "👨‍🎨", "👩‍🎨", "👨‍🏫", "👩‍🏫"]
    users = ["John D.", "Sarah M.", "Mike R.", "Emma W.", "David L.", "Lisa K.", "Tom B.", "Anna S."]

    queries = [
        "What's the status of invoice #12345?",
        "Can you approve my expense report?",
        "Show me pending invoices for this month",
        "How do I submit a new invoice?",
        "What's the approval workflow?",
        "Check vendor payment status",
        "Update invoice details",
        "Generate financial report",
        "This is great! Thank you for the help",
        "I love how easy this is to use",
        "The system is not working properly",
        "This is terrible, I can't find anything",
        "Perfect! Exactly what I needed",
        "The interface is slow and buggy"
    ]

    chats = []
    for i in range(min(limit, len(queries))):
        query = queries[i % len(queries)]
        # Analyze sentiment based on the query text
        sentiment = analyze_sentiment(query)
        chats.append({
            'id': i + 1,
            'user': random.choice(users),
            'avatar': random.choice(avatars),
            'query': query,
            'timestamp': f"{random.randint(1, 30)} min ago",
            'responseTime': round(random.uniform(0.5, 3.0), 1),
            'sentiment': sentiment
        })

    return jsonify({'chats': chats})

@app.route('/api/dashboard/chat-metrics')
def get_chat_metrics():
    persona = request.args.get('persona', 'finance-accounting')

    # Mock response time data
    response_time_data = [
        {'time': '9 AM', 'responseTime': 1.5},
        {'time': '10 AM', 'responseTime': 1.3},
        {'time': '11 AM', 'responseTime': 1.1},
        {'time': '12 PM', 'responseTime': 1.0},
        {'time': '1 PM', 'responseTime': 1.2},
        {'time': '2 PM', 'responseTime': 0.9},
    ]

    # Mock query volume data
    query_volume_data = [
        {'hour': '9 AM', 'queries': 45},
        {'hour': '10 AM', 'queries': 67},
        {'hour': '11 AM', 'queries': 89},
        {'hour': '12 PM', 'queries': 56},
        {'hour': '1 PM', 'queries': 78},
        {'hour': '2 PM', 'queries': 92},
    ]

    # Get sample queries and analyze their sentiment
    sample_queries = [
        "What's the status of invoice #12345?",
        "Can you approve my expense report?",
        "Show me pending invoices for this month",
        "How do I submit a new invoice?",
        "This is great! Thank you for the help",
        "I love how easy this is to use",
        "The system is not working properly",
        "This is terrible, I can't find anything",
        "Perfect! Exactly what I needed",
        "The interface is slow and buggy",
        "What's the approval workflow?",
        "Check vendor payment status"
    ]

    # Calculate sentiment percentages based on actual analysis
    sentiments = [analyze_sentiment(query) for query in sample_queries]
    total = len(sentiments)
    positive = sentiments.count('positive')
    neutral = sentiments.count('neutral')
    negative = sentiments.count('negative')

    return jsonify({
        'avgResponseTime': 1.2,
        'responseTimeData': response_time_data,
        'queryVolumeData': query_volume_data,
        'sentimentPercentages': {
            'positive': round((positive / total) * 100, 1),
            'neutral': round((neutral / total) * 100, 1),
            'negative': round((negative / total) * 100, 1)
        }
    })
# --- End Dashboard API Endpoints ---


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'nlq-processor'})

if __name__ == '__main__':
    print("🚀 Starting Flask NLQ Processing Server...")
    # Run in development mode
    app.run(host='127.0.0.1', port=8000, debug=True)