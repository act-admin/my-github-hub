import httpx
import re
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential
from config import (AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
                    AZURE_OPENAI_DEPLOYMENT_NAME, AZURE_OPENAI_API_VERSION,
                    USE_ENTRA_ID)

# Custom HTTP client with default settings and explicit timeout
http_client = httpx.Client(
    timeout=httpx.Timeout(30.0, connect=10.0),  # Adjust timeout as needed
)

# Initialize Azure OpenAI client with proper type handling (optional)
client = None

if AZURE_OPENAI_ENDPOINT:
    if USE_ENTRA_ID:
        try:
            credential = DefaultAzureCredential()
            token_provider = lambda: credential.get_token(
                "https://cognitiveservices.azure.com/.default").token
            client = AzureOpenAI(azure_endpoint=AZURE_OPENAI_ENDPOINT,
                                 azure_ad_token_provider=token_provider,
                                 api_version=AZURE_OPENAI_API_VERSION or "2024-02-01",
                                 http_client=http_client)
            print("✅ Azure OpenAI client initialized with Entra ID")
        except Exception as e:
            print(f"⚠️  Failed to initialize Azure OpenAI with Entra ID: {e}")
    elif AZURE_OPENAI_API_KEY:
        try:
            client = AzureOpenAI(azure_endpoint=AZURE_OPENAI_ENDPOINT,
                                 api_key=AZURE_OPENAI_API_KEY,
                                 api_version=AZURE_OPENAI_API_VERSION or "2024-02-01",
                                 http_client=http_client)
            print("✅ Azure OpenAI client initialized with API key")
        except Exception as e:
            print(f"⚠️  Failed to initialize Azure OpenAI with API key: {e}")
    else:
        print("⚠️  AZURE_OPENAI_API_KEY is required when not using Entra ID - NLQ features disabled")
else:
    print("⚠️  AZURE_OPENAI_ENDPOINT not configured - NLQ features disabled")


def extract_year_from_nlq(nlq: str) -> int:
    """Extract year from NLQ, default to 2025 for security"""
    year_match = re.search(r'\b(20\d{2})\b', nlq)
    return int(year_match.group(1)) if year_match else 2025


def validate_sql_security(sql: str, nlq: str) -> tuple[bool, str]:
    """
    CRITICAL SECURITY: Validate SQL for safety and compliance
    Returns (is_valid, error_message)
    """
    sql_upper = sql.upper().strip()

    # 1. ENFORCE SELECT-ONLY QUERIES
    if not sql_upper.startswith('SELECT'):
        return False, "SECURITY ERROR: Only SELECT queries are allowed"

    # 2. BLOCK DANGEROUS SQL OPERATIONS
    dangerous_keywords = [
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE',
        'EXEC', 'EXECUTE'
    ]
    for keyword in dangerous_keywords:
        if keyword in sql_upper:
            return False, f"SECURITY ERROR: {keyword} operations are not allowed"

    # 3. ENFORCE WHITELISTED TABLES ONLY
    allowed_tables = ['FINANCIAL_TRANSACTIONS', 'FINANCIAL_REPORTS', 'MEDICAL_RECORDS', 'MEDICAL_REPORTS']
    sql_has_table = False
    for table in allowed_tables:
        if table in sql_upper:
            sql_has_table = True
            break

    if not sql_has_table:
        return False, f"SECURITY ERROR: Query must use whitelisted tables: {allowed_tables}"

    # 4. ENSURE YEAR CONSTRAINTS for FINANCIAL_TRANSACTIONS and MEDICAL_RECORDS
    if 'FINANCIAL_TRANSACTIONS' in sql_upper or 'MEDICAL_RECORDS' in sql_upper:
        extracted_year = extract_year_from_nlq(nlq)

        # Check if query has any date/year filtering
        has_year_filter = any(
            pattern in sql_upper for pattern in
            ['YEAR(', f'= {extracted_year}', f'TRANSACTION_DATE', f'VISIT_DATE'])

        # If no year filter, we'll add one automatically in the nlq_to_sql function
        # This ensures security while allowing flexible queries

    return True, "Valid"


def enforce_deterministic_results(results: list, nlq: str) -> str:
    """
    DETERMINISM FIX: Return exact numeric results without LLM modification
    For structured queries, return precise numerical values directly
    """
    if not results or len(results) == 0:
        return "No results found"

    # Check if this is a simple aggregation query (SUM, COUNT, etc.)
    nlq_lower = nlq.lower()
    is_aggregation = any(
        word in nlq_lower for word in
        ['total', 'sum', 'count', 'maximum', 'minimum', 'max', 'min'])

    if is_aggregation and len(results) == 1 and len(results[0]) == 1:
        # Single numeric result - return exact value
        value = results[0][0]
        if value is None:
            return "0"

        # Format numeric values appropriately
        if isinstance(value, (int, float)):
            if value == int(value):
                return str(int(value))
            else:
                return f"{value:.2f}"
        return str(value)

    # For non-aggregation queries, return formatted results directly
    if len(results) <= 5:  # Small result sets
        formatted_results = []
        for row in results:
            formatted_row = " | ".join(
                str(val) if val is not None else "NULL" for val in row)
            formatted_results.append(formatted_row)
        return "\n".join(formatted_results)

    # Large result sets - return summary
    return f"Found {len(results)} results. First few: {results[:3]}"


def nlq_to_sql(nlq: str) -> str:
    """
    Converts natural language query to Snowflake SQL using Azure OpenAI.
    """
    if client is None:
        raise ValueError("Azure OpenAI client not configured. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.")
    
    prompt = f"""
    You are a SQL expert for Snowflake. Convert this natural language query to a valid Snowflake SQL query.
    
    Data sources available:
    - FINANCIAL_TRANSACTIONS: columns transaction_id (INTEGER), transaction_date (DATE), amount (DECIMAL(10,2)), category (VARCHAR), description (VARCHAR)
    - FINANCIAL_REPORTS: column report_data (VARIANT with report_id, report_date, content, file_name, source_type) - includes both quarterly reports AND extracted PDF content
    - MEDICAL_RECORDS: columns patient_id (INTEGER), visit_date (DATE), diagnosis (VARCHAR), treatment_cost (DECIMAL(10,2)), notes (VARCHAR)
    - MEDICAL_REPORTS: column report_data (VARIANT with report_id, report_date, content) - includes both medical reports AND extracted PDF/JSON content

    For structured calculations, use FINANCIAL_TRANSACTIONS (IGNORE company names in queries - data doesn't filter by company):
    - Revenue growth: SELECT YEAR(transaction_date) as year, SUM(amount) as revenue FROM FINANCIAL_TRANSACTIONS WHERE amount > 0 GROUP BY YEAR(transaction_date) ORDER BY year
    - Total revenue 2025: SELECT SUM(amount) FROM FINANCIAL_TRANSACTIONS WHERE amount > 0 AND YEAR(transaction_date) = 2025
    - Total expenses 2025: SELECT SUM(ABS(amount)) FROM FINANCIAL_TRANSACTIONS WHERE amount < 0 AND YEAR(transaction_date) = 2025  
    - Investment total: SELECT SUM(amount) FROM FINANCIAL_TRANSACTIONS WHERE category = 'Investment' AND YEAR(transaction_date) = 2025
    - Services revenue: SELECT SUM(amount) FROM FINANCIAL_TRANSACTIONS WHERE amount > 0 AND (description ILIKE '%service%' OR description ILIKE '%consulting%')
    - Products sold revenue: SELECT SUM(amount) FROM FINANCIAL_TRANSACTIONS WHERE amount > 0 AND (description ILIKE '%product%' OR category ILIKE '%product%')
    - Services in 2025: SELECT SUM(amount) FROM FINANCIAL_TRANSACTIONS WHERE amount > 0 AND YEAR(transaction_date) = 2025 AND (description ILIKE '%service%' OR description ILIKE '%consulting%')
    - Revenue by category: SELECT category, SUM(amount) as total FROM FINANCIAL_TRANSACTIONS WHERE amount > 0 GROUP BY category ORDER BY total DESC
    
    CRITICAL: NEVER filter by company names like "Global Revenue Corp" - use ALL transaction data regardless of company mentions.
    
    For broad searches (services, products, consulting), use ILIKE with wildcards and check both description and category columns.

    For medical structured queries, use MEDICAL_RECORDS:
    - Patient cost summary: SELECT patient_id, SUM(treatment_cost) as total_cost FROM MEDICAL_RECORDS WHERE YEAR(visit_date) = 2025 GROUP BY patient_id ORDER BY total_cost DESC
    - Diagnosis trends: SELECT diagnosis, COUNT(*) as count FROM MEDICAL_RECORDS WHERE YEAR(visit_date) = 2025 GROUP BY diagnosis ORDER BY count DESC
    - Monthly medical costs: SELECT MONTH(visit_date) as month, SUM(treatment_cost) as monthly_cost FROM MEDICAL_RECORDS WHERE YEAR(visit_date) = 2025 GROUP BY MONTH(visit_date) ORDER BY month
    - Patient visits by diagnosis: SELECT diagnosis, patient_id, visit_date, treatment_cost FROM MEDICAL_RECORDS WHERE diagnosis ILIKE '%keyword%' AND YEAR(visit_date) = 2025
    
    For medical PDF/JSON document queries, use MEDICAL_REPORTS:
    - Medical report content: SELECT report_data:content::string FROM MEDICAL_REPORTS WHERE report_data:report_id::string = 'specific_id'
    - All medical reports: SELECT report_data:report_id::string, report_data:content::string FROM MEDICAL_REPORTS
    - Report by date: SELECT report_data:content::string FROM MEDICAL_REPORTS WHERE report_data:report_date::string LIKE '%2025%'

    For PDF document queries (annual report, invoice data, document content), use FINANCIAL_REPORTS with source_type = 'PDF':
    - Annual report content: SELECT report_data:content::string FROM FINANCIAL_REPORTS WHERE report_data:source_type::string = 'PDF' AND report_data:file_name::string LIKE '%annual%'
    - Q4 invoice content: SELECT report_data:content::string FROM FINANCIAL_REPORTS WHERE report_data:source_type::string = 'PDF' AND report_data:file_name::string LIKE '%invoice%'
    - All PDF documents: SELECT report_data:file_name::string, report_data:content::string FROM FINANCIAL_REPORTS WHERE report_data:source_type::string = 'PDF'
    - Document search: SELECT report_data:content::string FROM FINANCIAL_REPORTS WHERE report_data:source_type::string = 'PDF' AND report_data:file_name::string LIKE '%keyword%'
    
    IMPORTANT: For PDF content queries, ALWAYS use FINANCIAL_REPORTS with source_type = 'PDF' to get actual document content, not just filenames.

    For report summaries, use FINANCIAL_REPORTS or MEDICAL_REPORTS respectively.
    
    Query: {nlq}
    Return only the SQL query, no explanations, and do not include markdown formatting (e.g., no ```sql
    """
    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_NAME,
        messages=[{
            "role": "system",
            "content": "You are a helpful SQL generator for Snowflake."
        }, {
            "role": "user",
            "content": prompt
        }],
        max_tokens=2000,
        temperature=0.0)
    # Extract and clean the SQL query, removing any leading/trailing whitespace or markdown
    sql = (response.choices[0].message.content or "").strip()
    # Remove any residual backticks or code block markers with proper replace syntax
    sql = sql.replace("```sql", "").replace("```", "").strip()

    # AUTO-INJECT YEAR CONSTRAINTS for FINANCIAL_TRANSACTIONS and MEDICAL_RECORDS if missing
    sql_upper = sql.upper()
    if 'FINANCIAL_TRANSACTIONS' in sql_upper or 'MEDICAL_RECORDS' in sql_upper:
        extracted_year = extract_year_from_nlq(nlq)
        has_year_filter = any(
            pattern in sql_upper for pattern in
            ['YEAR(', f'= {extracted_year}', f'TRANSACTION_DATE', f'VISIT_DATE'])

        if not has_year_filter:
            # Determine the correct date column based on table
            date_column = 'transaction_date' if 'FINANCIAL_TRANSACTIONS' in sql_upper else 'visit_date'
            
            # Inject year constraint automatically for security
            if 'WHERE' in sql_upper:
                # Add to existing WHERE clause
                sql = sql.replace(
                    ' WHERE ',
                    f' WHERE YEAR({date_column}) = {extracted_year} AND ',
                    1)
                sql = sql.replace(
                    ' where ',
                    f' WHERE YEAR({date_column}) = {extracted_year} AND ',
                    1)
            else:
                # Add WHERE clause before GROUP BY, ORDER BY, or at end
                if 'GROUP BY' in sql_upper:
                    sql = sql.replace(
                        ' GROUP BY',
                        f' WHERE YEAR({date_column}) = {extracted_year} GROUP BY',
                        1)
                    sql = sql.replace(
                        ' group by',
                        f' WHERE YEAR({date_column}) = {extracted_year} GROUP BY',
                        1)
                elif 'ORDER BY' in sql_upper:
                    sql = sql.replace(
                        ' ORDER BY',
                        f' WHERE YEAR({date_column}) = {extracted_year} ORDER BY',
                        1)
                    sql = sql.replace(
                        ' order by',
                        f' WHERE YEAR({date_column}) = {extracted_year} ORDER BY',
                        1)
                else:
                    sql = sql.rstrip(
                        ';'
                    ) + f' WHERE YEAR({date_column}) = {extracted_year}'

    # CRITICAL SECURITY VALIDATION
    is_valid, error_message = validate_sql_security(sql, nlq)
    if not is_valid:
        raise ValueError(f"SQL Security Validation Failed: {error_message}")

    return sql


def summarize_unstructured(content: str, summary_prompt: str) -> str:
    """
    Summarizes unstructured text with short, focused, digestible insights.
    """
    if client is None:
        return "Azure OpenAI not configured - unable to summarize content."
    
    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT_NAME,
        messages=[{
            "role":
            "system",
            "content":
            "You are a concise financial analyst. Provide only the 3-4 most important insights. Keep each point short and digestible. Use simple bullet points. Be extremely concise - each point should be maximum 15 words."
        }, {
            "role":
            "user",
            "content":
            f"Question: {summary_prompt}\n\nData: {content}\n\nGive me ONLY the 3-4 most critical insights. Each point must be very short (max 15 words). Focus on the most important numbers and trends only. Be extremely concise and presentable."
        }],
        max_tokens=1500,
        temperature=0.2)

    result = (response.choices[0].message.content or "").strip()

    # Ensure concise formatting
    lines = result.split('\n')
    formatted_lines = []
    count = 0

    for line in lines:
        line = line.strip()
        if line and count < 4:  # Limit to max 4 points
            if not line.startswith('-'):
                line = '- ' + line
            formatted_lines.append(line)
            count += 1

    return '\n'.join(formatted_lines)
