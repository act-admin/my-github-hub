from nlq_processor import nlq_to_sql, summarize_unstructured, enforce_deterministic_results
from snowflake_connector import execute_sql

# Mapping of quarter names to report dates
def quarter_dates(year):
    return {
        "q1": f"{year}-03-31",
        "q2": f"{year}-06-30", 
        "q3": f"{year}-09-30",
        "q4": f"{year}-12-31"
    }

def extract_year(nlq: str) -> int:
    """Extract year from query, default to 2025"""
    import re
    year_match = re.search(r'\b(20\d{2})\b', nlq)
    return int(year_match.group(1)) if year_match else 2025

def is_medical_query(nlq: str) -> bool:
    """Detect if query is related to medical data"""
    medical_keywords = [
        "patient", "diagnosis", "treatment", "medical", "visit", 
        "medical cost", "treatment cost", "patient cost", "diagnosis trends", 
        "medical record", "medical report", "medical summary"
    ]
    nlq_lower = nlq.lower()
    return any(keyword in nlq_lower for keyword in medical_keywords)

def wants_consolidation(nlq: str) -> bool:
    """Check if query wants consolidated/all reports"""
    consolidation_keywords = ["all", "overall", "full year", "annual", "ytd", "entire", "consolidated", "highlights", "overview", "reports", "year"]
    nlq_lower = nlq.lower()
    
    # Has consolidation keywords AND no specific quarter mentioned
    has_consolidation = any(keyword in nlq_lower for keyword in consolidation_keywords)
    quarters = quarter_dates(2025).keys()
    has_quarter = any(q in nlq_lower for q in quarters)
    
    return has_consolidation and not has_quarter

def classify_query(nlq: str) -> str:
    """
    Classifies query as 'structured', 'unstructured', or 'pdf'.
    Returns the query type for intelligent routing.
    """
    nlq_lower = nlq.lower()
    quarters = quarter_dates(2025).keys()
    
    # PDF-specific indicators (highest priority)
    pdf_indicators = [
        "annual report", "pdf", "document", "invoice", "q4 invoice", 
        "uploaded", "file", "files", "annual medical summary", "medical report content",
        "show me the medical report", "content of medical report"
    ]
    
    # Strong indicators of structured queries 
    structured_indicators = [
        "total", "sum", "maximum", "minimum", "max", "min", "count", 
        "which month", "what month", "expense", "revenue", "amount", 
        "transaction", "calculate", "find", "show me", "financials", 
        "performance", "sold", "services", "products", "consulting",
        # Medical indicators
        "patient", "diagnosis", "treatment", "cost", "medical", "visit", 
        "diagnosis trends", "patient cost", "treatment cost", "medical cost"
    ]
    
    # Unstructured report keywords
    unstructured_keywords = ["summary", "report", "update", "highlight", "highlights", "overview", "annual", "ytd", "medical report", "medical summary"]
    
    # Priority: PDF > Unstructured with summary/quarter > Structured > Default unstructured
    if any(indicator in nlq_lower for indicator in pdf_indicators):
        return "pdf"
    
    # CRITICAL FIX: Check for unstructured patterns BEFORE structured patterns
    # This ensures "financials summary Q1" routes to unstructured, not structured
    has_unstructured_keyword = any(keyword in nlq_lower for keyword in unstructured_keywords)
    has_quarter = any(q in nlq_lower for q in quarters)
    
    if has_unstructured_keyword or has_quarter:
        return "unstructured"
    elif any(indicator in nlq_lower for indicator in structured_indicators):
        return "structured"
    else:
        return "structured"  # Default to structured

def is_unstructured_query(nlq: str) -> bool:
    """Legacy function for backwards compatibility"""
    return classify_query(nlq) == "unstructured"

def process_nlq(nlq: str):
    """
    Processes an NLQ automatically, determining if it's structured, unstructured, or PDF-based,
    and includes the source in the output.
    """
    try:
        # Check for GenAI Suite Invoice requests FIRST
        nlq_lower = nlq.lower()
        
        # Check for accounts payable FIRST (approval workflows are AP-specific)
        ap_strong_indicators = [
            "approve invoice", "approve the invoice", "pending approval", 
            "awaiting approval", "reject invoice", "reject the invoice",
            "accounts payable", "ap automation", "vendor invoice",
            "invoice processing", "invoice automation", "ap dashboard"
        ]
        
        # AP vendor names (these are companies sending invoices TO us)
        ap_vendor_indicators = [
            "tech solutions", "global tech", "office supplies co", 
            "cloud services inc", "consulting partners"
        ]
        
        # Generic invoice indicators (could be AP or AR, need more context)
        general_invoice_indicators = [
            "invoice", "invoices", "which invoices", "show invoices", "invoice status"
        ]
        
        # Check for AP first - approval workflows and vendor names
        if (any(indicator in nlq_lower for indicator in ap_strong_indicators) or 
            any(vendor in nlq_lower for vendor in ap_vendor_indicators)):
            print(f"Detected GenAI Suite AP (Accounts Payable) request", flush=True)
            return "genai_invoice_suite"
        
        # Check for accounts receivable (AR-specific indicators)
        ar_strong_indicators = [
            "accounts receivable", "ar automation", "customer invoice", 
            "receivable", "receivables", "collection", "customer payment",
            "ar dashboard", "invoice sent to", "invoice to"
        ]
        
        # AR customer names (these are companies we sent invoices TO)
        ar_customer_indicators = [
            "manufacturing plus", "techcorp", "global retailers", "service dynamics"
        ]
        
        # Status change actions (change status, mark as paid, etc.)
        status_action_indicators = [
            "change status", "update status", "mark as", "set status",
            "change the status", "update the status", "mark it as", "set it to"
        ]
        has_status_action = any(indicator in nlq_lower for indicator in status_action_indicators)
        
        # Route to AR if: AR-specific indicators OR customer names OR status change without AP context
        if (any(indicator in nlq_lower for indicator in ar_strong_indicators) or 
            any(customer in nlq_lower for customer in ar_customer_indicators) or
            has_status_action):
            print(f"Detected GenAI Suite AR (Accounts Receivable) request", flush=True)
            return "genai_ar_suite"
        
        # Generic invoice queries default to AP (most common use case)
        if any(indicator in nlq_lower for indicator in general_invoice_indicators):
            print(f"Detected GenAI Suite AP (Accounts Payable) request", flush=True)
            return "genai_invoice_suite"
        
        # Check for Power BI dashboard request
        # Check for financial dashboard
        financial_indicators = ["financial dashboard", "finance dashboard", "financial analytics", 
                              "finance report", "financial report", "show financial", "open financial"]
        if any(indicator in nlq_lower for indicator in financial_indicators):
            print(f"Detected Financial Power BI dashboard request", flush=True)
            return "powerbi_financial_dashboard"
        
        # Check for medical dashboard
        medical_indicators = ["medical dashboard", "medical analytics", "medical report", 
                            "show medical", "open medical", "healthcare dashboard"]
        if any(indicator in nlq_lower for indicator in medical_indicators):
            print(f"Detected Medical Power BI dashboard request", flush=True)
            return "powerbi_medical_dashboard"
        
        # Legacy support for generic Power BI requests (defaults to financial)
        if "power bi" in nlq_lower or "powerbi" in nlq_lower:
            print(f"Detected generic Power BI dashboard request (defaulting to financial)", flush=True)
            return "powerbi_financial_dashboard"
        
        # Extract common variables upfront to avoid scoping issues
        year = extract_year(nlq)
        quarters_map = quarter_dates(year)
        
        query_type = classify_query(nlq)
        print(f"Query: '{nlq}' classified as: {query_type}", flush=True)
        
        # Handle PDF queries
        if query_type == "pdf":
            # Determine if this is a medical or financial PDF query  
            if is_medical_query(nlq):
                # For medical PDF queries, filter by content to get the right document
                if "annual" in nlq.lower() or "summary" in nlq.lower():
                    sql = f"""
                    SELECT report_data:content::string as content
                    FROM medical_reports 
                    WHERE report_data:content::string ILIKE '%ANNUAL%'
                       AND report_data:content::string ILIKE '%SUMMARY%'
                    LIMIT 1
                    """
                else:
                    sql = f"""
                    SELECT report_data:content::string as content
                    FROM medical_reports 
                    WHERE report_data:content::string IS NOT NULL
                    LIMIT 5
                    """
            else:
                sql = nlq_to_sql(nlq)
            print(f"Generated SQL for PDF: {sql}")
            results = execute_sql(sql)
            print(f"Snowflake results for PDF: {results}")
            
            if results and len(results) > 0:
                # CRITICAL FIX: Handle different column structures for PDF queries
                # Single column queries return content directly: [('content',)]
                # Multi-column queries return filename + content: [('filename', 'content')]
                row = results[0]
                if len(row) == 1:
                    # Single column - should be content
                    pdf_content = row[0] if row[0] else "No content found"
                elif len(row) == 2:
                    # Two columns - filename, content (take the second column)
                    pdf_content = row[1] if row[1] else "No content found"
                else:
                    # Unexpected structure - try last column as content
                    pdf_content = row[-1] if row[-1] else "No content found"
                
                print(f"Found PDF content (columns: {len(row)}): {pdf_content[:200]}...")
                
                # Analyze the real PDF content
                analysis = summarize_unstructured(pdf_content, f"Answer this question based on the PDF content: {nlq}")
                print(f"Generated analysis for PDF: {analysis}")
                return f"Analysis (Source: PDF Documents): {analysis}"
            else:
                return f"No PDF content found for: {nlq} (Source: PDF Documents)"
        
        # Handle unstructured queries (existing logic)
        elif query_type == "unstructured":
            print(f"Processing as unstructured query")
            
            if wants_consolidation(nlq):
                # Consolidated query - get ALL reports for the year
                print(f"Processing consolidated query for year {year}")
                # Determine if this is a medical or financial query
                if is_medical_query(nlq):
                    # For medical reports, directly access CORTEX.PARSE_DOCUMENT parsed content
                    report_sql = f"""
                        SELECT report_data:content::string AS content 
                        FROM medical_reports 
                        WHERE report_data:content::string IS NOT NULL
                        ORDER BY report_data:report_date::string
                    """
                else:
                    report_sql = f"""
                        SELECT report_data:content::string AS content 
                        FROM financial_reports 
                        WHERE YEAR(TO_DATE(report_data:report_date::string)) = {year}
                        ORDER BY TO_DATE(report_data:report_date::string)
                    """
                print(f"Executing consolidated SQL: {report_sql}")
                try:
                    results = execute_sql(report_sql)
                    print(f"Snowflake results for consolidated: {results}")
                    if results and len(results) > 0:
                        # Combine all report contents
                        contents = [row[0] for row in results if row[0]]
                        combined_content = "\n\n".join(contents)
                        print(f"Combined {len(contents)} reports, total length: {len(combined_content)}")
                        
                        # Use consolidated prompt
                        consolidated_prompt = f"Consolidate highlights across all {year} quarterly reports for: {nlq}. Focus on totals/trends and provide clear actionable insights. Avoid per-quarter repetition."
                        summary = summarize_unstructured(combined_content, consolidated_prompt)
                        print(f"Generated consolidated summary: {summary}")
                        source_type = "medical_reports" if is_medical_query(nlq) else "financial_reports"
                        return f"Summary (Source: Unstructured - {source_type}, Consolidated {year}): {summary}"
                    else:
                        source_type = "medical_reports" if is_medical_query(nlq) else "financial_reports"
                        return f"No report data found for year {year} (Source: Unstructured - {source_type}, Consolidated {year})."
                except Exception as snowflake_error:
                    print(f"Snowflake error for consolidated: {snowflake_error}")
                    source_type = "medical_reports" if is_medical_query(nlq) else "financial_reports"
                    return f"Error retrieving consolidated report data: {snowflake_error} (Source: Unstructured - {source_type}, Consolidated {year})"
            else:
                # Specific quarter query
                q_key = next((q for q in quarters_map if q in nlq.lower()), None)
                quarter_date = quarters_map.get(q_key or "q1", quarters_map["q1"])  # Default to Q1
                
                # Determine if this is a medical or financial query
                if is_medical_query(nlq):
                    # For medical reports, search for quarter text in the parsed PDF content
                    quarter_text = q_key.upper() if q_key else "Q1"
                    report_sql = f"""
                        SELECT report_data:content::string 
                        FROM medical_reports 
                        WHERE (report_data:content::string ILIKE '%{quarter_text}%' 
                           OR report_data:content::string ILIKE '%{quarter_text} {year}%'
                           OR report_data:file_name::string ILIKE '%{q_key}_%{year}%')
                        AND report_data:content::string IS NOT NULL
                    """
                else:
                    report_sql = f"SELECT report_data:content::string FROM financial_reports WHERE report_data:report_date::date = '{quarter_date}'"
                print(f"Executing quarter-specific SQL: {report_sql}")
                try:
                    results = execute_sql(report_sql)
                    print(f"Snowflake results for quarter: {results}")
                    if results and len(results) > 0 and results[0][0]:
                        content = results[0][0]
                        print(f"Found content for quarter: {content[:200]}...")
                        summary = summarize_unstructured(content, nlq)
                        print(f"Generated quarter summary: {summary}")
                        source_type = "medical_reports" if is_medical_query(nlq) else "financial_reports"
                        return f"Summary (Source: Unstructured - {source_type}): {summary}"
                    else:
                        quarter_label = q_key.upper() if q_key else "quarter"
                        print(f"No report data found for {quarter_label}")
                        source_type = "medical_reports" if is_medical_query(nlq) else "financial_reports"
                        return f"No report data found for {quarter_label} (Source: Unstructured - {source_type})."
                except Exception as snowflake_error:
                    print(f"Snowflake error for quarter: {snowflake_error}")
                    source_type = "medical_reports" if is_medical_query(nlq) else "financial_reports"
                    return f"Error retrieving report data: {snowflake_error} (Source: Unstructured - {source_type})"
        else:
            # For structured data, generate and execute the query
            sql = nlq_to_sql(nlq)
            print(f"Generated SQL: {sql}")
            results = execute_sql(sql)
            print(f"Snowflake results for structured: {results}")
            
            # CRITICAL FIX: Return exact deterministic results without LLM modification
            if results and len(results) > 0:
                # Use deterministic results for 100% precision
                exact_result = enforce_deterministic_results(results, nlq)
                print(f"Deterministic result for structured: {exact_result}")
                # Determine source based on query content
                source_table = "medical_records" if is_medical_query(nlq) else "financial_transactions"
                return f"{exact_result} (Source: Structured - {source_table})"
            else:
                source_table = "medical_records" if is_medical_query(nlq) else "financial_transactions"
                return f"No results found for: {nlq} (Source: Structured - {source_table})"
    except Exception as e:
        return f"Error: {e} (Source: N/A)"

if __name__ == "__main__":
    # Example structured NLQ
    nlq_structured = "What is the total revenue in 2025?"
    print(f"\nProcessing NLQ: {nlq_structured}")
    results_structured = process_nlq(nlq_structured)
    print(f"Results: {results_structured}")

    # Example unstructured NLQ
    nlq_unstructured = "What is the financial summary for Q2?"
    print(f"\nProcessing NLQ: {nlq_unstructured}")
    summary = process_nlq(nlq_unstructured)
    print(f"Summary: {summary}")

    # Interactive mode without structured/unstructured prompt
    while True:
        user_nlq = input("\nEnter your NLQ (or 'exit' to quit): ")
        if user_nlq.lower() == 'exit':
            break
        result = process_nlq(user_nlq)
        print(f"Result: {result}")