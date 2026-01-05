# Overview

AgentCore is a comprehensive multi-agent orchestration system built with Express.js, React, and **Strands Agents SDK** that coordinates AI-powered agents to process natural language queries and perform various enterprise tasks. The system features a hybrid architecture: Node.js frontend/API layer integrated with a Python backend powered by Strands Agents SDK for true multi-agent capabilities. It uses real OpenAI models for intent parsing and orchestration, PostgreSQL for persistent data storage, and integrates with multiple enterprise APIs to execute actions like employee searches, project management, and data retrieval. The application features real-time WebSocket communication, a modern React dashboard, comprehensive agent monitoring capabilities, and **seamless Power BI and GenAI Suite dashboard integration** for invoice automation and financial/medical analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **TanStack Query** for server state management and API caching
- **Wouter** for lightweight client-side routing
- **Shadcn/ui** components with Radix UI primitives for consistent design
- **Tailwind CSS** for styling with custom CSS variables for theming
- **WebSocket integration** for real-time updates from the backend

## Backend Architecture
- **Express.js** server with TypeScript for the REST API
- **WebSocket server** using the `ws` library for real-time communication
- **Python Flask backend** with Azure OpenAI integration for natural language processing
- **Snowflake database connectivity** for multi-domain data queries (financial and medical)
- **Modular service architecture** with separate services for different AI providers and external APIs
- **Middleware-based request logging** and error handling

## Data Storage Solutions
- **Snowflake Data Warehouse** as the primary data storage with multi-domain support:
  - **Financial domain**: `FINANCIAL_TRANSACTIONS` (structured) and `FINANCIAL_REPORTS` (unstructured PDF/JSON)
  - **Medical domain**: `MEDICAL_RECORDS` (structured patient data) and `MEDICAL_REPORTS` (unstructured medical documents)
- **Intelligent query routing** automatically detects query domain and routes to appropriate tables
- **Dynamic source attribution** shows data origin in AI responses

## AI Orchestration System
- **Strands Agents SDK** as the primary multi-agent framework providing model-driven AI agent coordination
- **Hybrid orchestration** with Node.js coordinating Python-based Strands agents via subprocess communication
- **Real OpenAI GPT-4** integration for intent parsing and dynamic query processing
- **Specialized agent architecture** with dedicated HR, Data, Project, and Security agents built using Strands tools and decorators
- **Intelligent task routing** where the system determines optimal agent activation based on query intent and content
- **Fallback mechanisms** with graceful degradation to mock responses when Strands backend is unavailable

## Authentication and Authorization
- **Session-based authentication** planned but not yet implemented
- **User management system** with database schema prepared for user accounts
- **Role-based access control** structure in place for future implementation

## Real-time Communication
- **WebSocket server** for broadcasting agent status updates and query processing progress
- **Connection management** with automatic reconnection logic on the frontend
- **Message broadcasting** to all connected clients for system-wide updates

## Dashboard Integration System
- **Three-dashboard architecture** for comprehensive data visualization:
  - **Power BI Financial Dashboard**: Financial analytics and reporting (Workspace: 4b21a894-9b20-446b-9c43-8f3c09daf243, Report: 70a9bb4d-d2b7-47e8-a8e1-0691928061bb)
  - **Power BI Medical Dashboard**: Healthcare analytics and patient data (Report: ffc3a176-212b-4a33-b10a-311b4151d5b1)
  - **GenAI Suite Finance Automation**: Real-time invoice processing with both **Accounts Payable (AP)** and **Accounts Receivable (AR)** support
    - AP Dashboard: https://scodac-finance-automation-dashboard.replit.app/accounts-payable
    - AR Dashboard: https://scodac-finance-automation-dashboard.replit.app/accounts-receivable
- **Intelligent query routing** detects user intent and automatically displays the appropriate dashboard:
  - **AP queries** (vendor invoices, pending approval, approve invoice) → GenAI Suite AP Dashboard
  - **AR queries** (customer invoices, receivables, invoice sent to) → GenAI Suite AR Dashboard
  - **Financial analytics** → Power BI Financial Dashboard
  - **Medical analytics** → Power BI Medical Dashboard
- **Dynamic processing steps** that adapt based on query type:
  - **Power BI queries**: Shows Power BI-specific steps (query validation, dashboard config, service principal auth, data source connection, embed token generation)
  - **GenAI Suite (AP/AR)**: Shows finance-specific steps (authentication, invoice/customer search, approval/payment analysis, financial data retrieval, response generation)
  - **Snowflake data queries**: Shows data query steps (validation, intent analysis, SQL generation, Snowflake retrieval, AI response generation)
  - Processing steps display real-time progress with completed/processing/pending status indicators
- **Dynamic agent sidebar** that updates based on query context:
  - **GenAI AP queries**: Finance Agent, AP Automation Agent, Vendor Agent
  - **GenAI AR queries**: Finance Agent, AR Automation Agent, Customer Agent
  - **Power BI Financial**: Analytics Agent, Power BI Agent, Financial Data Agent
  - **Power BI Medical**: Analytics Agent, Power BI Agent, Healthcare Data Agent
  - **Snowflake queries**: Data Agent, Snowflake Agent, AI Response Agent
  - Agents display with color-coded status indicators (Active/Processing/Idle)
- **Dual-mode AI response system** for GenAI Suite queries:
  - **Viewing queries**: Concise 3-4 line summaries with key invoice details (invoice IDs, amounts, due dates)
  - **Action requests**: Intelligent acknowledgment showing invoice details, current status, requested change, and confirmation prompt
- **Smart AR/AP detection** with priority-based classification:
  - AR indicators (checked first): "accounts receivable", "invoice sent to", "invoice to", "customer", specific customer names (Manufacturing Plus, TechCorp, etc.)
  - AP indicators: "accounts payable", "invoice from", "vendor", "pending approval", specific vendor names
- **Flexible action detection** using word-based matching to handle natural language variations:
  - Detects: "change status", "change the status", "update status", "mark as", "set status"
  - Prevents status filtering on action requests to avoid incorrect data retrieval
- **Backend detection logic** in `server/main.py` classifies queries and returns dashboard signals
- **Frontend iframe rendering** in `client/src/components/nlq-interface.tsx` displays dashboards seamlessly within chat interface
- **Service principal authentication** eliminates per-browser authentication requirements for Power BI
- **GenAI Suite AI responses with real data**: System fetches actual invoice data from `/api/genai-invoices` endpoint (AP: INV-24-5847, INV-24-5848; AR: INV-AR-24-2848, etc.) and uses Azure OpenAI to format responses with real invoice IDs, amounts, vendors/customers, and dates - no fake data generated (configured in `server/app.py` and `server/index.ts`)

# External Dependencies

## AI and ML Services
- **Strands Agents SDK** - Model-driven multi-agent framework for autonomous AI workflows
- **OpenAI GPT-4** - Real language model for intent parsing, entity extraction, and agent coordination
- **Python-based agent tools** - Strands decorators for creating specialized agent capabilities
- **@neondatabase/serverless** - Neon database driver for PostgreSQL connections

## Enterprise API Integrations
- **Oracle HRMS** - Employee data and HR management (mocked for development)
- **Snowflake** - Data warehouse queries and analytics (mocked for development)
- **Jira** - Project management and issue tracking (mocked for development)
- **Zendesk** - Customer support and ticketing (mocked for development)

## Database and Caching
- **PostgreSQL** - Primary database through Neon serverless
- **Redis** - Caching layer with in-memory fallback for development
- **Drizzle ORM** - Type-safe database operations and migrations

## Frontend Libraries
- **React Query (@tanstack/react-query)** - Server state management
- **React Hook Form** - Form handling and validation
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Date-fns** - Date manipulation utilities

## Development and Build Tools
- **TypeScript** - Type safety across the entire stack
- **Vite** - Frontend build tool and development server
- **ESBuild** - Backend bundling for production
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing and autoprefixer