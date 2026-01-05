
# AgentCore - Multi-Agent AI Orchestration Platform
## System Architecture Diagram

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend Layer (React + TypeScript)"
        UI[User Interface]
        QI[Query Interface Component]
        WF[Workflow Visual Component]
        RT[Real-time Dashboard]
        WS_CLIENT[WebSocket Client]
    end

    %% API Gateway Layer
    subgraph "API Gateway Layer (Express.js)"
        API[Express API Server]
        ROUTES[Route Handlers]
        WS_SERVER[WebSocket Server]
        MIDDLEWARE[Authentication & Middleware]
    end

    %% Core Orchestration Layer
    subgraph "AI Orchestration Core"
        AZURE_AI[Azure OpenAI Service]
        BEDROCK[Bedrock Agent Core]
        INTENT[Intent Parser]
        ORCHESTRATOR[Agent Orchestrator]
    end

    %% Multi-Agent Backend (Hybrid Architecture)
    subgraph "Multi-Agent Backend"
        subgraph "Node.js Sub-Agents"
            HR_NODE[HR Agent (Node.js)]
            DATA_NODE[Data Agent (Node.js)]
            PROJECT_NODE[Project Agent (Node.js)]
            SECURITY_NODE[Security Agent (Node.js)]
        end
        
        subgraph "Strands Agents SDK (Python)"
            STRANDS_BACKEND[Strands Backend.py]
            STRANDS_HR[HR Tools]
            STRANDS_DATA[Data Tools]
            STRANDS_PROJECT[Project Tools]
            STRANDS_SECURITY[Security Tools]
        end
    end

    %% External Integrations
    subgraph "External API Integrations"
        PDL[People Data Labs API]
        JSONPH[JSONPlaceholder API]
        EXTERNAL[Other Enterprise APIs]
    end

    %% Data & Storage Layer
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL Database)]
        REDIS[(Redis Cache)]
        REPLIT_STORAGE[(Replit Object Storage)]
    end

    %% Real-time Communication Flow
    UI --> QI
    QI --> API
    API --> AZURE_AI
    AZURE_AI --> INTENT
    INTENT --> BEDROCK
    BEDROCK --> ORCHESTRATOR
    
    %% Agent Orchestration Flow
    ORCHESTRATOR --> HR_NODE
    ORCHESTRATOR --> DATA_NODE
    ORCHESTRATOR --> PROJECT_NODE
    ORCHESTRATOR --> SECURITY_NODE
    
    %% Strands Integration (Hybrid)
    ORCHESTRATOR --> STRANDS_BACKEND
    STRANDS_BACKEND --> STRANDS_HR
    STRANDS_BACKEND --> STRANDS_DATA
    STRANDS_BACKEND --> STRANDS_PROJECT
    STRANDS_BACKEND --> STRANDS_SECURITY
    
    %% External API Calls
    STRANDS_HR --> PDL
    HR_NODE --> PDL
    DATA_NODE --> JSONPH
    PROJECT_NODE --> JSONPH
    SECURITY_NODE --> JSONPH
    
    %% Data Storage
    HR_NODE --> POSTGRES
    DATA_NODE --> REDIS
    PROJECT_NODE --> POSTGRES
    SECURITY_NODE --> POSTGRES
    STRANDS_BACKEND --> POSTGRES
    
    %% Real-time Updates
    WS_SERVER --> WS_CLIENT
    ORCHESTRATOR --> WS_SERVER
    
    %% Response Flow
    HR_NODE --> ORCHESTRATOR
    DATA_NODE --> ORCHESTRATOR
    PROJECT_NODE --> ORCHESTRATOR
    SECURITY_NODE --> ORCHESTRATOR
    STRANDS_BACKEND --> ORCHESTRATOR
    ORCHESTRATOR --> API
    API --> WS_SERVER
    API --> UI
    
    %% File Storage
    REPLIT_STORAGE --> API
    
    %% Styling
    classDef frontend fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef ai fill:#fff3e0
    classDef agents fill:#e8f5e8
    classDef storage fill:#fce4ec
    classDef external fill:#f1f8e9
    
    class UI,QI,WF,RT,WS_CLIENT frontend
    class API,ROUTES,WS_SERVER,MIDDLEWARE api
    class AZURE_AI,BEDROCK,INTENT,ORCHESTRATOR ai
    class HR_NODE,DATA_NODE,PROJECT_NODE,SECURITY_NODE,STRANDS_BACKEND,STRANDS_HR,STRANDS_DATA,STRANDS_PROJECT,STRANDS_SECURITY agents
    class POSTGRES,REDIS,REPLIT_STORAGE storage
    class PDL,JSONPH,EXTERNAL external
```

## Architecture Components Overview

### 🎨 **Frontend Layer (React + TypeScript)**
- **Query Interface**: Natural language input with real-time chat
- **Workflow Visualization**: Shows multi-agent orchestration progress
- **Real-time Dashboard**: Live updates via WebSocket
- **Results Display**: Dynamic employee search and project management

### 🚀 **API Gateway (Express.js)**
- **RESTful APIs**: Standard HTTP endpoints for data operations
- **WebSocket Server**: Real-time bidirectional communication
- **Route Management**: Organized endpoint handling
- **Middleware**: Authentication, logging, error handling

### 🧠 **AI Orchestration Core**
- **Azure OpenAI Service**: Intent parsing and natural language understanding
- **Bedrock Agent Core**: Main orchestrator that coordinates all agents
- **Intent Parser**: Extracts entities and determines agent routing
- **Agent Orchestrator**: Manages multi-agent workflows

### 🤖 **Hybrid Multi-Agent Backend**
- **Node.js Sub-Agents**: Fast, lightweight agents for simple operations
- **Strands SDK Agents**: Advanced Python agents with real AI tools
- **Specialized Tools**: HR, Data, Project, and Security domain experts
- **Cross-Platform Communication**: Seamless Node.js ↔ Python integration

### 🌐 **External Integrations**
- **People Data Labs**: Real professional data from LinkedIn sources
- **JSONPlaceholder**: REST API for testing and development
- **Enterprise APIs**: Extensible integration framework

### 💾 **Data & Storage Layer**
- **PostgreSQL**: Primary database for employees, projects, assignments
- **Redis Cache**: High-performance caching for frequent queries
- **Replit Object Storage**: File storage for documents and assets

## 🔄 **Data Flow Architecture**

### **Query Processing Pipeline**
1. **User Input** → Natural language query through React interface
2. **Intent Analysis** → Azure OpenAI extracts meaning and entities
3. **Agent Orchestration** → Bedrock Agent coordinates specialists
4. **Parallel Execution** → Multiple agents work simultaneously
5. **Result Aggregation** → Combine outputs from all agents
6. **Real-time Updates** → WebSocket broadcasts progress
7. **Response Delivery** → Structured results to user interface

### **Multi-Agent Coordination**
- **Centralized Orchestration**: Bedrock Agent manages workflow
- **Specialized Agents**: Each agent has domain expertise
- **Parallel Processing**: Agents work concurrently for speed
- **Result Synthesis**: Intelligent combination of agent outputs

### **Real-time Communication**
- **WebSocket Channels**: Bidirectional real-time updates
- **Event Broadcasting**: Status updates across all connected clients
- **Progress Tracking**: Live monitoring of agent execution

## 🏗️ **Reusability & Scalability Features**

### **Modular Agent Architecture**
- **Pluggable Agents**: Easy to add new domain specialists
- **Standardized Interfaces**: Consistent agent communication protocol
- **Tool-based Design**: Reusable functions across different agents

### **API-First Design**
- **RESTful Endpoints**: Standard interfaces for all operations
- **GraphQL Ready**: Schema-driven data access
- **Microservice Architecture**: Independent, scalable components

### **Enterprise Integration**
- **Multiple Data Sources**: People Data Labs, enterprise APIs
- **Caching Strategy**: Redis for performance optimization
- **Persistent Storage**: PostgreSQL for reliable data management

This architecture enables **seamless integration** across multiple enterprise applications while maintaining **real-time performance** and **intelligent AI coordination**.
