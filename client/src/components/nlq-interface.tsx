import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Send,
  User,
  Bot,
  Database,
  Snowflake,
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart3,
  FolderOpen,
  Shield,
  ExternalLink,
  FileSearch,
  Brain,
  Network,
  CheckCircle2,
  Clock,
  AlertCircle,
  Code,
  Zap,
  DollarSign,
  BarChart,
  LayoutDashboard,
} from "lucide-react";
import { SiSnowflake } from "react-icons/si";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import scodacLogo from "@assets/ScodacLogoApproved.png";
import scodacFavicon from "@assets/scodac-favicon.png";
import billionIcon from "@assets/billionicon.png";
import botIcon from "@assets/botIcon.png";
import botImage from "@assets/botImage.png";
import userIcon from "@assets/user_profile.jpg";
import PowerBIEmbedServerToken from "@/components/PowerBIEmbedServerToken";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import convsGif from "@assets/conversation.gif";
import bot from "@assets/bot.png";
import chatinterfaceicon from "@assets/chatinterfaceicon.png";

interface QueryResult {
  query: string;
  sql: string;
  results: any[];
  summary?: string;
  message?: string;
  error?: string;
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  sql?: string;
  results?: any[];
  summary?: string;
  powerBIDashboard?: boolean;
  dashboardType?: "financial" | "medical";
  genaiSuite?: boolean;
  genaiSuiteType?: "ap" | "ar";
  timestamp: Date;
}

// Power BI Dashboard Configuration
const POWERBI_DASHBOARDS = {
  financial: {
    reportId: "70a9bb4d-d2b7-47e8-a8e1-0691928061bb",
    groupId: "4b21a894-9b20-446b-9c43-8f3c09daf243",
    name: "Financial Analytics",
  },
  medical: {
    reportId: "ffc3a176-212b-4a33-b10a-311b4151d5b1",
    groupId: "4b21a894-9b20-446b-9c43-8f3c09daf243",
    name: "Medical Analytics",
  },
};

// GenAI Suite Configuration
const GENAI_SUITE_URLS = {
  ap: "https://scodac-finance-automation-dashboard.replit.app/accounts-payable",
  ar: "https://scodac-finance-automation-dashboard.replit.app/accounts-receivable",
};

// Processing stage interface
interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  duration?: number;
  timestamp?: Date;
}

interface NLQInterfaceProps {
  hideSidebar?: boolean;
  showHeader?: boolean;
  pageTitle?: string;
  showFooter?: boolean;
}

const NLQInterface: React.FC<NLQInterfaceProps> = ({
  hideSidebar = false,
  showHeader = false,
  pageTitle = "",
  showFooter = false,
}) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>(
    [],
  );
  const [expandedDashboards, setExpandedDashboards] = useState<Set<string>>(
    new Set(),
  );
  const [currentQueryType, setCurrentQueryType] = useState<string>("default");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const lastAssistantMessageRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to start of last assistant message when messages change
  useEffect(() => {
    if (
      messages.length > 0 &&
      messages[messages.length - 1].type === "assistant"
    ) {
      lastAssistantMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [messages]);

  // Get dynamic title based on query type
  const getHeaderTitle = () => {
    switch (currentQueryType) {
      case "genai_ap":
        return "Finance Automation - Accounts Payable Assistant";
      case "genai_ar":
        return "Finance Automation - Accounts Receivable Assistant";
      case "powerbi_financial":
        return "Financial Analytics Dashboard Assistant";
      case "powerbi_medical":
        return "Healthcare Analytics Dashboard Assistant";
      case "snowflake":
        return "Data Analytics and Query Assistant";
      default:
        return "Agent Status";
    }
  };

  // Get dynamic chat header title - shows processing agent or fixed title
  const getChatHeaderTitle = () => {
    // Check if any processing stage is currently active
    const isProcessing = processingStages.some(
      (stage) => stage.status === "processing",
    );

    if (isProcessing) {
      // Find the currently processing agent
      const processingAgent = activeAgents.find(
        (agent) => agent.status === "Processing",
      );
      if (processingAgent) {
        return `${processingAgent.name} ...`;
      }
    }

    // If not processing, return the fixed title based on query type
    return getHeaderTitle();
  };

  const getCurrentDate = () => {
    const today = new Date();
    const day = today.getDate();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = monthNames[today.getMonth()];
    return `Today: ${day} ${month}`;
  };

  // Function to render markdown formatting
  const renderMarkdownText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return (
          <span key={index} className="font-semibold text-foreground">
            {boldText}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Dynamic agents based on query type
  const [activeAgents, setActiveAgents] = useState<
    Array<{
      name: string;
      status: string;
      color: string;
      icon: any;
    }>
  >([]);

  const apiConnections = [
    { name: "Oracle HRMS", status: "online" },
    { name: "Snowflake", status: "online" },
    { name: "Jira API", status: "online" },
    { name: "Zendesk", status: "online" },
  ];

  // Initialize processing stages
  const initializeProcessingStages = (queryText: string) => {
    const stages: ProcessingStage[] = [
      {
        id: "validation",
        name: "Query received and validated",
        description: `Processing: "${queryText.length > 50 ? queryText.substring(0, 50) + "..." : queryText}"`,
        status: "processing",
      },
      {
        id: "intent",
        name: "Intent Parsing and Prompt Construction",
        description: "Analyzing query intent and building AI prompts",
        status: "pending",
      },
      {
        id: "orchestration",
        name: "SQL Generation and Validation",
        description: "Generating optimized SQL queries and validating syntax",
        status: "pending",
      },
      {
        id: "database",
        name: "Snowflake Data Retrieval and Processing",
        description:
          "Executing queries and retrieving data from Snowflake warehouse",
        status: "pending",
      },
      {
        id: "processing",
        name: "AI Response Generation and Delivery",
        description:
          "Generating natural language response and formatting results",
        status: "pending",
      },
    ];
    setProcessingStages(stages);
  };

  // Initialize finance-specific processing stages
  const initializeFinanceProcessingStages = (
    queryText: string,
    module: "AP" | "AR",
  ) => {
    const isAP = module === "AP";
    const stages: ProcessingStage[] = [
      {
        id: "validation",
        name: `${isAP ? "AP" : "AR"} Query Authentication and Validation`,
        description: `Validating "${queryText.length > 40 ? queryText.substring(0, 40) + "..." : queryText}" against finance security policies`,
        status: "processing",
      },
      {
        id: "intent",
        name: `${isAP ? "Invoice Database" : "Customer Account"} Search and Filtering`,
        description: `Searching ${isAP ? "accounts payable invoices" : "accounts receivable records"} and applying business rules`,
        status: "pending",
      },
      {
        id: "orchestration",
        name: `${isAP ? "Approval Workflow" : "Payment Status"} Analysis`,
        description: `Analyzing ${isAP ? "invoice approval workflows and vendor data" : "payment history and customer account status"}`,
        status: "pending",
      },
      {
        id: "database",
        name: "Financial Data Retrieval and Processing",
        description: `Retrieving ${isAP ? "vendor invoices, approval chains, and payment schedules" : "customer payments, outstanding balances, and transaction history"}`,
        status: "pending",
      },
      {
        id: "processing",
        name: `${isAP ? "AP" : "AR"} Response Generation and Delivery`,
        description: `Generating intelligent finance automation response with ${isAP ? "invoice management" : "receivables tracking"} insights`,
        status: "pending",
      },
    ];
    setProcessingStages(stages);
  };

  // Initialize Power BI processing stages
  const initializePowerBIProcessingStages = (
    queryText: string,
    type: "financial" | "medical",
  ) => {
    const isFinancial = type === "financial";
    const stages: ProcessingStage[] = [
      {
        id: "validation",
        name: "Power BI Query Validation",
        description: `Authenticating "${queryText.length > 40 ? queryText.substring(0, 40) + "..." : queryText}" for Power BI access`,
        status: "processing",
      },
      {
        id: "intent",
        name: "Dashboard Configuration Loading",
        description: `Loading ${isFinancial ? "financial analytics" : "medical analytics"} dashboard configuration`,
        status: "pending",
      },
      {
        id: "orchestration",
        name: "Service Principal Authentication",
        description: `Authenticating with Azure AD and Power BI service`,
        status: "pending",
      },
      {
        id: "database",
        name: `${isFinancial ? "Financial" : "Medical"} Data Source Connection`,
        description: `Connecting to ${isFinancial ? "financial reports and transactions" : "medical records and patient data"} datasets`,
        status: "pending",
      },
      {
        id: "processing",
        name: "Power BI Embed Token Generation",
        description: `Generating secure embed token and rendering ${isFinancial ? "financial" : "medical"} dashboard`,
        status: "pending",
      },
    ];
    setProcessingStages(stages);
  };

  // Initialize Snowflake data query processing stages
  const initializeSnowflakeProcessingStages = (queryText: string) => {
    const stages: ProcessingStage[] = [
      {
        id: "validation",
        name: "Query Validation and Parsing",
        description: `Processing: "${queryText.length > 50 ? queryText.substring(0, 50) + "..." : queryText}"`,
        status: "processing",
      },
      {
        id: "intent",
        name: "Intent Analysis and Domain Detection",
        description: "Analyzing query to determine financial or medical domain",
        status: "pending",
      },
      {
        id: "orchestration",
        name: "SQL Generation and Optimization",
        description: "Generating optimized SQL queries for Snowflake warehouse",
        status: "pending",
      },
      {
        id: "database",
        name: "Snowflake Data Retrieval",
        description:
          "Executing queries and retrieving data from Snowflake warehouse",
        status: "pending",
      },
      {
        id: "processing",
        name: "AI Response Generation",
        description: "Generating natural language response with Azure OpenAI",
        status: "pending",
      },
    ];
    setProcessingStages(stages);
  };

  // Set active agents based on query type with progressive loading
  const setAgentsForQueryType = async (queryType: string) => {
    setCurrentQueryType(queryType);
    setActiveAgents([]); // Clear existing agents

    let agentsToAdd: Array<{
      name: string;
      status: string;
      color: string;
      icon: any;
    }> = [];

    switch (queryType) {
      case "genai_ap":
        agentsToAdd = [
          {
            name: "Finance Agent",
            status: "Analyzing invoice data",
            color: "bg-emerald-500",
            icon: DollarSign,
          },
          {
            name: "AP Automation Agent",
            status: "Processing approvals",
            color: "bg-blue-500",
            icon: Zap,
          },
          {
            name: "Vendor Agent",
            status: "Retrieving vendor info",
            color: "bg-purple-500",
            icon: Users,
          },
        ];
        break;
      case "genai_ar":
        agentsToAdd = [
          {
            name: "Finance Agent",
            status: "Analyzing receivables",
            color: "bg-emerald-500",
            icon: DollarSign,
          },
          {
            name: "AR Automation Agent",
            status: "Processing payments",
            color: "bg-blue-500",
            icon: Zap,
          },
          {
            name: "Customer Agent",
            status: "Retrieving customer data",
            color: "bg-purple-500",
            icon: Users,
          },
        ];
        break;
      case "powerbi_financial":
        agentsToAdd = [
          {
            name: "Analytics Agent",
            status: "Validating query",
            color: "bg-emerald-500",
            icon: BarChart3,
          },
          {
            name: "Power BI Agent",
            status: "Generating dashboard",
            color: "bg-yellow-500",
            icon: LayoutDashboard,
          },
          {
            name: "Financial Data Agent",
            status: "Connecting to data source",
            color: "bg-orange-500",
            icon: Database,
          },
        ];
        break;
      case "powerbi_medical":
        agentsToAdd = [
          {
            name: "Analytics Agent",
            status: "Validating query",
            color: "bg-emerald-500",
            icon: BarChart3,
          },
          {
            name: "Power BI Agent",
            status: "Generating dashboard",
            color: "bg-yellow-500",
            icon: LayoutDashboard,
          },
          {
            name: "Healthcare Data Agent",
            status: "Connecting to data source",
            color: "bg-red-500",
            icon: Database,
          },
        ];
        break;
      case "snowflake":
        agentsToAdd = [
          {
            name: "Data Agent",
            status: "Analyzing query",
            color: "bg-emerald-500",
            icon: BarChart3,
          },
          {
            name: "Snowflake Agent",
            status: "Executing SQL query",
            color: "bg-cyan-500",
            icon: SiSnowflake,
          },
          {
            name: "AI Response Agent",
            status: "Generating response",
            color: "bg-indigo-500",
            icon: Brain,
          },
        ];
        break;
      default:
        agentsToAdd = [
          {
            name: "Data Agent",
            status: "Processing request",
            color: "bg-emerald-500",
            icon: BarChart3,
          },
        ];
    }

    // Add agents progressively with delay for dynamic effect
    for (let i = 0; i < agentsToAdd.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400)); // 400ms delay between agents
      setActiveAgents((prev) => [...prev, agentsToAdd[i]]);
    }
  };

  // Update processing stage
  const updateProcessingStage = (
    id: string,
    status: ProcessingStage["status"],
    duration?: number,
  ) => {
    setProcessingStages((prev) =>
      prev.map((stage) =>
        stage.id === id
          ? {
              ...stage,
              status,
              duration,
              timestamp: new Date(),
            }
          : stage,
      ),
    );
  };

  const queryMutation = useMutation({
    mutationFn: async (query: string): Promise<QueryResult> => {
      const startTime = Date.now();

      // Check for hardcoded responses first to determine query type
      const queryLower = query.toLowerCase();

      // POWER BI DASHBOARD Response
      if (
        queryLower.includes("financial analytics") ||
        queryLower.includes("show financial") ||
        queryLower.includes("financial dashboard") ||
        queryLower.includes("analytics dashboard") ||
        queryLower.includes("show dashboard")
      ) {
        initializePowerBIProcessingStages(query, "financial");
        setAgentsForQueryType("powerbi_financial");

        await new Promise((resolve) => setTimeout(resolve, 100));
        updateProcessingStage("validation", "completed", 0.05);

        updateProcessingStage("intent", "processing");
        await new Promise((resolve) => setTimeout(resolve, 300));
        updateProcessingStage("intent", "completed", 0.3);

        updateProcessingStage("orchestration", "processing");
        await new Promise((resolve) => setTimeout(resolve, 200));
        updateProcessingStage("orchestration", "completed", 0.2);

        updateProcessingStage("database", "processing");
        await new Promise((resolve) => setTimeout(resolve, 400));
        updateProcessingStage("database", "completed", 0.4);

        updateProcessingStage("processing", "processing");
        await new Promise((resolve) => setTimeout(resolve, 200));
        updateProcessingStage("processing", "completed", 0.2);

        return {
          query,
          sql: "",
          results: [],
          summary: "Loading your financial analytics dashboard...",
          message: "powerbi_dashboard",
        };
      }

      // THANK YOU Response
      if (queryLower.includes("thank you") || queryLower.includes("thanks")) {
        initializeProcessingStages(query);

        await new Promise((resolve) => setTimeout(resolve, 100));
        updateProcessingStage("validation", "completed", 0.05);

        updateProcessingStage("intent", "processing");
        await new Promise((resolve) => setTimeout(resolve, 200));
        updateProcessingStage("intent", "completed", 0.2);

        updateProcessingStage("orchestration", "processing");
        await new Promise((resolve) => setTimeout(resolve, 150));
        updateProcessingStage("orchestration", "completed", 0.15);

        updateProcessingStage("database", "processing");
        await new Promise((resolve) => setTimeout(resolve, 150));
        updateProcessingStage("database", "completed", 0.15);

        updateProcessingStage("processing", "processing");
        await new Promise((resolve) => setTimeout(resolve, 100));
        updateProcessingStage("processing", "completed", 0.1);

        return {
          query,
          sql: "",
          results: [],
          summary:
            "You're very welcome! 😊\n\nI'm here to help you manage your financial queries efficiently.\n\nFeel free to ask me anything about your financial operations. I'm designed to make your finance processes **smarter**, **faster**, and **more automated**.\n\nHave a great day!",
        };
      }

      // Make API call first to determine query type
      const response = await apiRequest("POST", "/api/process-nlq", { query });
      const data = await response.json();

      // Initialize appropriate processing stages based on response type
      if (data.message === "genai_invoice_suite") {
        initializeFinanceProcessingStages(query, "AP");
        setAgentsForQueryType("genai_ap");
      } else if (data.message === "genai_ar_suite") {
        initializeFinanceProcessingStages(query, "AR");
        setAgentsForQueryType("genai_ar");
      } else if (data.message === "powerbi_financial_dashboard") {
        initializePowerBIProcessingStages(query, "financial");
        setAgentsForQueryType("powerbi_financial");
      } else if (data.message === "powerbi_medical_dashboard") {
        initializePowerBIProcessingStages(query, "medical");
        setAgentsForQueryType("powerbi_medical");
      } else {
        // Default to Snowflake for data queries
        initializeSnowflakeProcessingStages(query);
        setAgentsForQueryType("snowflake");
      }

      // Simulate processing stages with quick completion
      await new Promise((resolve) => setTimeout(resolve, 100));
      updateProcessingStage("validation", "completed", 0.05);

      updateProcessingStage("intent", "processing");
      await new Promise((resolve) => setTimeout(resolve, 200));
      updateProcessingStage("intent", "completed", 0.2);

      updateProcessingStage("orchestration", "processing");
      await new Promise((resolve) => setTimeout(resolve, 200));
      updateProcessingStage("orchestration", "completed", 0.2);

      updateProcessingStage("database", "processing");
      await new Promise((resolve) => setTimeout(resolve, 300));
      const totalTime = (Date.now() - startTime) / 1000;
      updateProcessingStage(
        "database",
        "completed",
        Math.max(0.3, totalTime - 0.75),
      );

      updateProcessingStage("processing", "processing");
      await new Promise((resolve) => setTimeout(resolve, 100));
      updateProcessingStage("processing", "completed", 0.1);

      return data;
    },
    onError: (error: Error) => {
      console.error("Query mutation failed:", error);

      // Mark current stage as error
      setProcessingStages((prev) =>
        prev.map((stage) =>
          stage.status === "processing" ? { ...stage, status: "error" } : stage,
        ),
      );

      // Add assistant error message
      const assistantMessage: Message = {
        id: Date.now().toString() + "-assistant",
        type: "assistant",
        content: `Sorry, I couldn't process your query. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      toast({
        title: "Connection Error",
        description:
          "Failed to process your query. The system is automatically retrying...",
        variant: "destructive",
      });
    },
    onSuccess: (data: QueryResult) => {
      if (data.error) {
        // Add assistant error message
        const assistantMessage: Message = {
          id: Date.now().toString() + "-assistant",
          type: "assistant",
          content: `Error: ${data.error}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        toast({
          title: "Query Error",
          description: data.error,
          variant: "destructive",
        });
      } else {
        // Handle both structured (with results) and unstructured (with summary) queries
        let content: string;
        let toastMessage: string;
        let isPowerBIDashboard = false;
        let isGenAISuite = false;
        let dashboardType: "financial" | "medical" | undefined;

        let genaiSuiteType: "ap" | "ar" | undefined;
        if (
          data.message === "genai_invoice_suite" ||
          data.message === "genai_ar_suite"
        ) {
          // GenAI Suite Invoice Automation response (AP or AR)
          const dashboardLabel =
            data.message === "genai_ar_suite"
              ? "Accounts Receivable"
              : "Invoice Automation";
          content =
            data.summary ||
            `Loading your intelligent ${dashboardLabel.toLowerCase()} dashboard...`;
          toastMessage = `${dashboardLabel} dashboard loaded successfully`;
          isGenAISuite = true;
          genaiSuiteType = data.message === "genai_ar_suite" ? "ar" : "ap";
        } else if (data.message === "powerbi_financial_dashboard") {
          // Financial Power BI Dashboard response
          content =
            data.summary || "Loading your financial analytics dashboard...";
          toastMessage = "Financial Dashboard loaded successfully";
          isPowerBIDashboard = true;
          dashboardType = "financial";
        } else if (data.message === "powerbi_medical_dashboard") {
          // Medical Power BI Dashboard response
          content =
            data.summary || "Loading your medical analytics dashboard...";
          toastMessage = "Medical Dashboard loaded successfully";
          isPowerBIDashboard = true;
          dashboardType = "medical";
        } else if (data.message === "powerbi_dashboard") {
          // Legacy Power BI Dashboard response (defaults to financial)
          content =
            data.summary || "Loading your financial analytics dashboard...";
          toastMessage = "Dashboard loaded successfully";
          isPowerBIDashboard = true;
          dashboardType = "financial";
        } else if (data.summary) {
          // Unstructured query with summary - already set in mutationFn
          content = data.summary;
          toastMessage = "Summary generated successfully";
        } else if (data.results && data.results.length > 0) {
          // Structured query with results - already set in mutationFn
          content = `Found ${data.results.length} results from your query.`;
          toastMessage = `Found ${data.results.length} results`;
        } else {
          // No results or summary
          content = "Query completed, but no results found.";
          toastMessage = "Query completed";
        }

        const assistantMessage: Message = {
          id: Date.now().toString() + "-assistant",
          type: "assistant",
          content: content,
          sql: data.sql,
          results: data.results,
          powerBIDashboard: isPowerBIDashboard,
          dashboardType: dashboardType,
          genaiSuite: isGenAISuite,
          genaiSuiteType: genaiSuiteType,
          summary: data.summary,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        toast({
          title: "Query Executed",
          description: toastMessage,
        });

        // Log query for analytics (only if query text is available)
        if (data.query && data.query.trim()) {
          apiRequest("POST", "/api/log-query", {
            query: data.query,
            persona: "finance-accounting", // Default to finance for now
          }).catch((err) => console.log("Query logging failed:", err));
        }

        // Keep processing status visible - don't auto-hide
      }
    },
  });

  const handleSubmit = () => {
    if (!query.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a query to execute",
        variant: "destructive",
      });
      return;
    }

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString() + "-user",
      type: "user",
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    queryMutation.mutate(query);
    setQuery(""); // Clear input after sending
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Processing Status Component - Always visible
  const ProcessingStatusDisplay = () => {
    const getStageIcon = (
      stageId: string,
      status: ProcessingStage["status"],
    ) => {
      const iconSize = "w-4 h-4";
      const containerSize = "w-8 h-8";

      const IconContainer = ({
        children,
        bgColor,
        isActive,
      }: {
        children: React.ReactNode;
        bgColor: string;
        isActive: boolean;
      }) => (
        <div
          className={`${containerSize} rounded-full flex items-center justify-center ${bgColor} ${isActive ? "animate-pulse" : ""}`}
        >
          {children}
        </div>
      );

      switch (stageId) {
        case "validation":
          return (
            <IconContainer
              bgColor={
                status === "completed" || status === "processing"
                  ? "bg-blue-500"
                  : "bg-muted"
              }
              isActive={status === "processing"}
            >
              {status === "error" ? (
                <AlertCircle className={`${iconSize} text-white`} />
              ) : (
                <MessageCircle className={`${iconSize} text-white`} />
              )}
            </IconContainer>
          );

        case "intent":
          return (
            <IconContainer
              bgColor={
                status === "completed" || status === "processing"
                  ? "bg-purple-500"
                  : "bg-muted"
              }
              isActive={status === "processing"}
            >
              {status === "error" ? (
                <AlertCircle className={`${iconSize} text-white`} />
              ) : (
                <Brain className={`${iconSize} text-white`} />
              )}
            </IconContainer>
          );

        case "orchestration":
          return (
            <IconContainer
              bgColor={
                status === "completed" || status === "processing"
                  ? "bg-green-500"
                  : "bg-muted"
              }
              isActive={status === "processing"}
            >
              {status === "error" ? (
                <AlertCircle className={`${iconSize} text-white`} />
              ) : (
                <Code className={`${iconSize} text-white`} />
              )}
            </IconContainer>
          );

        case "database":
          return (
            <IconContainer
              bgColor={
                status === "completed" || status === "processing"
                  ? "bg-orange-500"
                  : "bg-muted"
              }
              isActive={status === "processing"}
            >
              {status === "error" ? (
                <AlertCircle className={`${iconSize} text-white`} />
              ) : (
                <Database className={`${iconSize} text-white`} />
              )}
            </IconContainer>
          );

        case "processing":
          return (
            <IconContainer
              bgColor={
                status === "completed" || status === "processing"
                  ? "bg-teal-500"
                  : "bg-muted"
              }
              isActive={status === "processing"}
            >
              {status === "error" ? (
                <AlertCircle className={`${iconSize} text-white`} />
              ) : (
                <Zap className={`${iconSize} text-white`} />
              )}
            </IconContainer>
          );

        default:
          return (
            <IconContainer bgColor="bg-muted" isActive={false}>
              <Circle className={`${iconSize} text-muted-foreground`} />
            </IconContainer>
          );
      }
    };

    const getStageColors = (
      stageId: string,
      status: ProcessingStage["status"],
    ) => {
      const baseColors = {
        validation: {
          completed: "bg-blue-50 border-blue-200",
          processing: "bg-blue-100 border-blue-300",
          error: "bg-red-50 border-red-200",
          pending: "bg-gray-50 border-gray-200",
        },
        intent: {
          completed: "bg-purple-50 border-purple-200",
          processing: "bg-purple-100 border-purple-300",
          error: "bg-red-50 border-red-200",
          pending: "bg-gray-50 border-gray-200",
        },
        orchestration: {
          completed: "bg-green-50 border-green-200",
          processing: "bg-green-100 border-green-300",
          error: "bg-red-50 border-red-200",
          pending: "bg-gray-50 border-gray-200",
        },
        database: {
          completed: "bg-orange-50 border-orange-200",
          processing: "bg-orange-100 border-orange-300",
          error: "bg-red-50 border-red-200",
          pending: "bg-gray-50 border-gray-200",
        },
        processing: {
          completed: "bg-teal-50 border-teal-200",
          processing: "bg-teal-100 border-teal-300",
          error: "bg-red-50 border-red-200",
          pending: "bg-gray-50 border-gray-200",
        },
      };

      return (
        baseColors[stageId as keyof typeof baseColors]?.[status] ||
        "bg-gray-50 border-gray-200"
      );
    };

    const allCompleted =
      processingStages.length > 0 &&
      processingStages.every((stage) => stage.status === "completed");
    const hasError = processingStages.some((stage) => stage.status === "error");
    const isProcessing = processingStages.some(
      (stage) => stage.status === "processing",
    );

    return (
      <div
        className="bg-card border border-border rounded-lg shadow-sm h-full flex flex-col"
        data-testid="processing-status"
      >
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Query Processing Status
            </h3>
            <div className="flex items-center space-x-2">
              {processingStages.length === 0 ? (
                <>
                  <div className="w-2 h-2 bg-muted rounded-full" />
                  <span className="text-sm text-muted-foreground font-medium">
                    Idle
                  </span>
                </>
              ) : allCompleted ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-green-600 font-medium">
                    Completed
                  </span>
                </>
              ) : hasError ? (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm text-red-600 font-medium">
                    Error
                  </span>
                </>
              ) : isProcessing ? (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm text-blue-600 font-medium">
                    Processing
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-muted rounded-full" />
                  <span className="text-sm text-muted-foreground font-medium">
                    Ready
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-x-auto px-4 py-6">
          {processingStages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">Awaiting query...</p>
              <p className="text-xs mt-2">
                Processing status will appear here when you submit a query
              </p>
            </div>
          ) : (
            <div className="flex gap-4 min-w-max pb-2">
              {processingStages.map((stage, index) => (
                <div
                  key={stage.id}
                  className={`flex-shrink-0 w-64 p-5 rounded-xl border-2 ${getStageColors(stage.id, stage.status)} transition-all duration-300 shadow-sm`}
                  data-testid={`stage-${stage.id}`}
                >
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getStageIcon(stage.id, stage.status)}
                      </div>
                      <h4 className="font-bold text-sm text-black flex-1">
                        {stage.name}
                      </h4>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {stage.description}
                      </p>
                      {stage.duration && (
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                          Completed in {stage.duration} sec
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`${hideSidebar ? "h-full" : "h-screen"} bg-background flex flex-col md:flex-row`}
    >
      {/* Left Sidebar */}
      {!hideSidebar && (
        <div
          className={`w-full ${sidebarCollapsed ? "md:w-16" : "md:w-64"} bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 md:h-screen`}
          data-testid="sidebar"
        >
          {/* SCODAC Logo */}
          <div
            className="p-4 border-b border-sidebar-border"
            data-testid="logo-section"
          >
            <div
              className={`flex items-center ${sidebarCollapsed ? "justify-center w-full" : "space-x-2"}`}
            >
              <img
                src={sidebarCollapsed ? scodacFavicon : scodacLogo}
                alt="SCODAC"
                className={`transition-all duration-300 ${sidebarCollapsed ? "h-8 w-8" : "h-8 w-auto"}`}
                data-testid="img-logo"
              />
            </div>
          </div>

          {/* Connection Status */}
          {!sidebarCollapsed && (
            <div
              className="p-4 border-b border-sidebar-border flex items-center justify-between"
              data-testid="connection-status"
            >
              <h3 className="text-sm font-medium text-sidebar-foreground">
                Connection Status
              </h3>
              <div className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 rounded-full bg-green-500"
                  data-testid="status-connected"
                ></div>
                <span className="text-sm text-sidebar-foreground">
                  Connected
                </span>
              </div>
            </div>
          )}

          {/* Agent Status */}
          <div
            className={`${sidebarCollapsed ? "p-2" : "p-4"} border-b border-sidebar-border flex-1`}
            data-testid="agent-status"
          >
            {!sidebarCollapsed && (
              <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
                Agent Status
              </h3>
            )}
            <div
              className={`${sidebarCollapsed ? "space-y-4 flex flex-col items-center" : "space-y-3"}`}
            >
              {activeAgents.map((agent, index) => {
                const IconComponent = agent.icon;
                return (
                  <div
                    key={agent.name}
                    className={`${sidebarCollapsed ? "flex justify-center" : "flex items-center space-x-3"}`}
                    data-testid={`agent-${agent.name.toLowerCase().replace(" ", "-")}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${agent.color} flex items-center justify-center`}
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    {!sidebarCollapsed && (
                      <div>
                        <div className="text-sm font-medium text-sidebar-foreground">
                          {agent.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {agent.status}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* API Connections */}
          {!sidebarCollapsed && (
            <div className="p-4" data-testid="api-connections">
              <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
                API Connections
              </h3>
              <div className="space-y-2">
                <div
                  className="flex items-center justify-between"
                  data-testid="connection-snowflake"
                >
                  <span className="text-xs text-muted-foreground">
                    Snowflake
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    online
                  </span>
                </div>
                {/* <div className="flex items-center justify-between" data-testid="connection-jira">
                <span className="text-xs text-gray-600">Jira API</span>
                <span className="text-xs text-green-600 font-medium">online</span>
              </div>
              <div className="flex items-center justify-between" data-testid="connection-oracle">
                <span className="text-xs text-gray-600">Oracle HRMS</span>
                <span className="text-xs text-green-600 font-medium">online</span>
              </div> */}
                <div
                  className="flex items-center justify-between"
                  data-testid="connection-zendesk"
                >
                  <span className="text-xs text-muted-foreground">OpenAI</span>
                  <span className="text-xs text-green-600 font-medium">
                    online
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toggle Button - At intersection of sidebar and header (hidden on mobile) */}
      {!hideSidebar && (
        <div
          className={`hidden md:block absolute top-4 ${sidebarCollapsed ? "left-12" : "left-60"} z-20 transition-all duration-300`}
        >
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 bg-card border border-border rounded-full shadow-sm hover:bg-secondary transition-colors"
            data-testid="button-toggle-sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      )}

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        data-testid="main-content"
      >
        {/* Main Content Area - Vertical Layout */}
        <div
          className="flex-1 flex flex-col p-2 bg-background overflow-auto"
          data-testid="main-content-area"
        >
          {/* Chat Interface Container */}
          <div
            className="flex flex-col overflow-hidden bg-card border border-border rounded-xl shadow-md mb-4 w-full min-h-[calc(100vh-8rem)]"
            data-testid="chat-interface"
          >
            {/* Personal Assistant Header with Agent Status Timeline */}
            <div
              className="px-3 sm:px-4 md:px-6 py-3 border-b border-border flex-shrink-0"
              data-testid="personal-assistant-header"
            >
              {activeAgents.length > 0 ? (
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
                    Agent Activity
                  </h3>
                  <div className="flex items-center">
                    {activeAgents.map((agent, index) => {
                      return (
                        <div
                          key={index}
                          className="flex items-center"
                          data-testid={`agent-status-${index}`}
                        >
                          <div className="flex items-center gap-2 px-3">
                            <div
                              className={`w-3 h-3 rounded-full ${agent.color} flex-shrink-0 shadow-md`}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                                {agent.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {agent.status}
                              </span>
                            </div>
                          </div>
                          {index < activeAgents.length - 1 && (
                            <div className="w-8 h-[2px] bg-border" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
                    Agentic Status
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0 shadow-md" />
                    <span className="text-sm text-foreground">Active</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Area with Scrolling */}
            <div
              className="flex-1 flex flex-col overflow-hidden"
              data-testid="chat-area"
            >
              <div
                className="flex-1 overflow-y-auto p-6"
                data-testid="chat-messages-container"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div
                      className="text-center"
                      data-testid="conversation-start"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4">
                        <img
                          src={convsGif}
                          alt="Bot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p
                        className="text-muted-foreground mb-8"
                        data-testid="text-start-conversation"
                      >
                        Start a conversation with your AI assistant
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="messages-container">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        ref={
                          message.type === "assistant" &&
                          index === messages.length - 1
                            ? lastAssistantMessageRef
                            : null
                        }
                        className={`flex items-start ${message.type === "user" ? "justify-end" : "gap-3 justify-start"} mb-5`}
                        data-testid={`message-${message.type}-${message.id}`}
                      >
                        {message.type === "assistant" && (
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
                              <img
                                src={bot}
                                alt="Bot"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        <div
                          className={`flex flex-col ${message.type === "user" ? "items-end" : "items-start"} ${message.powerBIDashboard || message.genaiSuite ? "w-full" : ""}`}
                        >
                          <div
                            className={`${message.powerBIDashboard || message.genaiSuite ? "w-full" : message.type === "user" ? "max-w-[100%]" : "max-w-[75%]"} px-5 py-3 rounded-2xl shadow-sm break-words ${
                              message.type === "user"
                                ? "bg-blue-50 text-gray-900"
                                : "bg-purple-50 text-gray-900"
                            }`}
                          >
                            <div
                              className="text-sm"
                              data-testid={`message-content-${message.id}`}
                            >
                              {message.genaiSuite ? (
                                <div className="space-y-4">
                                  <div className="prose prose-sm max-w-none">
                                    {message.content
                                      .split("\n")
                                      .map((line, idx) => {
                                        // Skip empty lines
                                        if (!line.trim())
                                          return (
                                            <div key={idx} className="h-2" />
                                          );

                                        // Main headers (bold text at start)
                                        if (line.match(/^\*\*[^*]+\*\*\s*$/)) {
                                          const text = line.replace(
                                            /\*\*/g,
                                            "",
                                          );
                                          return (
                                            <h3
                                              key={idx}
                                              className="text-lg font-bold text-blue-900 mb-3 mt-4"
                                            >
                                              {text}
                                            </h3>
                                          );
                                        }

                                        // Bullet points with invoice details
                                        if (line.trim().startsWith("•")) {
                                          const content = line
                                            .replace("•", "")
                                            .trim();
                                          // Parse the line for bold items
                                          const parts =
                                            content.split(/(\*\*[^*]+\*\*)/g);

                                          return (
                                            <div
                                              key={idx}
                                              className="flex items-start space-x-2 py-1.5 border-l-4 border-blue-400 pl-3 mb-2 bg-blue-50/50"
                                            >
                                              <span className="text-blue-600 font-bold mt-0.5">
                                                •
                                              </span>
                                              <div className="flex-1 text-foreground">
                                                {parts.map((part, pIdx) => {
                                                  if (
                                                    part.startsWith("**") &&
                                                    part.endsWith("**")
                                                  ) {
                                                    const boldText =
                                                      part.replace(/\*\*/g, "");
                                                    // Check if it's a currency amount
                                                    if (
                                                      boldText.match(
                                                        /\$[\d,]+\.?\d*/,
                                                      )
                                                    ) {
                                                      return (
                                                        <span
                                                          key={pIdx}
                                                          className="font-bold text-green-700"
                                                        >
                                                          {boldText}
                                                        </span>
                                                      );
                                                    }
                                                    // Check if it's an invoice ID
                                                    if (
                                                      boldText.match(
                                                        /INV-\d+-\d+/,
                                                      )
                                                    ) {
                                                      return (
                                                        <span
                                                          key={pIdx}
                                                          className="font-bold text-purple-700"
                                                        >
                                                          {boldText}
                                                        </span>
                                                      );
                                                    }
                                                    // Other bold items
                                                    return (
                                                      <span
                                                        key={pIdx}
                                                        className="font-semibold text-foreground"
                                                      >
                                                        {boldText}
                                                      </span>
                                                    );
                                                  }
                                                  return (
                                                    <span key={pIdx}>
                                                      {part}
                                                    </span>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        }

                                        // Summary or other text with bold items
                                        const parts =
                                          line.split(/(\*\*[^*]+\*\*)/g);
                                        return (
                                          <p
                                            key={idx}
                                            className="text-foreground leading-relaxed mb-2"
                                          >
                                            {parts.map((part, pIdx) => {
                                              if (
                                                part.startsWith("**") &&
                                                part.endsWith("**")
                                              ) {
                                                const boldText = part.replace(
                                                  /\*\*/g,
                                                  "",
                                                );
                                                // Check if it's a currency
                                                if (
                                                  boldText.match(
                                                    /\$[\d,]+\.?\d*/,
                                                  )
                                                ) {
                                                  return (
                                                    <span
                                                      key={pIdx}
                                                      className="font-bold text-green-700"
                                                    >
                                                      {boldText}
                                                    </span>
                                                  );
                                                }
                                                // Check if it contains a number (like "4 invoices", "3 items")
                                                if (boldText.match(/\d+/)) {
                                                  return (
                                                    <span
                                                      key={pIdx}
                                                      className="font-bold text-blue-700"
                                                    >
                                                      {boldText}
                                                    </span>
                                                  );
                                                }
                                                return (
                                                  <span
                                                    key={pIdx}
                                                    className="font-semibold text-foreground"
                                                  >
                                                    {boldText}
                                                  </span>
                                                );
                                              }
                                              return (
                                                <span key={pIdx}>{part}</span>
                                              );
                                            })}
                                          </p>
                                        );
                                      })}
                                  </div>

                                  <Button
                                    onClick={() => {
                                      const newExpanded = new Set(
                                        expandedDashboards,
                                      );
                                      if (newExpanded.has(message.id)) {
                                        newExpanded.delete(message.id);
                                      } else {
                                        newExpanded.add(message.id);
                                      }
                                      setExpandedDashboards(newExpanded);
                                    }}
                                    variant="outline"
                                    className="w-full border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium"
                                    data-testid={`button-view-genai-suite-${message.id}`}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    {expandedDashboards.has(message.id)
                                      ? "Hide"
                                      : "View"}{" "}
                                    GenAI Suite Dashboard
                                  </Button>

                                  {expandedDashboards.has(message.id) && (
                                    <div
                                      className="w-full rounded-lg overflow-hidden shadow-md"
                                      style={{ height: "750px" }}
                                    >
                                      <iframe
                                        src={
                                          message.genaiSuiteType === "ar"
                                            ? GENAI_SUITE_URLS.ar
                                            : GENAI_SUITE_URLS.ap
                                        }
                                        frameBorder="0"
                                        allowFullScreen={true}
                                        className="w-full h-full rounded border border-border bg-card"
                                        title={
                                          message.genaiSuiteType === "ar"
                                            ? "GenAI Accounts Receivable Suite"
                                            : "GenAI Invoice Automation Suite"
                                        }
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : message.powerBIDashboard ? (
                                (() => {
                                  const dashboardConfig =
                                    POWERBI_DASHBOARDS[
                                      message.dashboardType || "financial"
                                    ];
                                  const dashboardName = dashboardConfig.name;

                                  // Check if medical dashboard is configured
                                  if (
                                    message.dashboardType === "medical" &&
                                    !dashboardConfig.reportId
                                  ) {
                                    return (
                                      <div className="space-y-3">
                                        <p className="text-sm text-foreground mb-2">
                                          {message.content}
                                        </p>
                                        <div className="w-full p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                                          <p className="text-sm text-yellow-800">
                                            Medical dashboard is not yet
                                            configured. Please add the medical
                                            report to Power BI and update the
                                            configuration.
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <ErrorBoundary
                                      fallback={
                                        <div className="space-y-3">
                                          <p className="text-sm text-foreground mb-2">
                                            {message.content}
                                          </p>
                                          <div
                                            className="w-full"
                                            style={{ height: "600px" }}
                                          >
                                            <iframe
                                              src={`https://app.powerbi.com/reportEmbed?reportId=${dashboardConfig.reportId}&groupId=${dashboardConfig.groupId}&autoAuth=true&ctid=0b9cef37-e9f5-4d4e-8714-f947e79248ac`}
                                              frameBorder="0"
                                              allowFullScreen={true}
                                              className="w-full h-full rounded border border-border"
                                              title={`${dashboardName} Dashboard`}
                                            />
                                          </div>
                                        </div>
                                      }
                                    >
                                      <PowerBIEmbedServerToken
                                        reportId={dashboardConfig.reportId}
                                        groupId={dashboardConfig.groupId}
                                        message={message.content}
                                      />
                                    </ErrorBoundary>
                                  );
                                })()
                              ) : (
                                message.content
                                  .split("\n")
                                  .map((line, index) => (
                                    <div key={index} className="mb-2 last:mb-0">
                                      {line.trim() ? (
                                        <div className="flex items-start space-x-2">
                                          {line.trim().startsWith("-") ||
                                          line.trim().startsWith("•") ? (
                                            <>
                                              <span className="text-blue-600 font-bold mt-0.5">
                                                •
                                              </span>
                                              <span className="flex-1 leading-relaxed">
                                                {line
                                                  .replace(/^[-•]\s*/, "")
                                                  .split(
                                                    /(\b\d+[\d,]*%?\b|\b\$[\d,]+\.?\d*\b|\b[A-Z]{2,}\b|\b[A-Z][a-z]+\s+[A-Z][a-z]+\b)/,
                                                  )
                                                  .map((part, partIndex) => {
                                                    if (
                                                      /\b\d+[\d,]*%?\b|\b\$[\d,]+\.?\d*\b/.test(
                                                        part,
                                                      )
                                                    ) {
                                                      return (
                                                        <span
                                                          key={partIndex}
                                                          className="font-semibold text-green-700"
                                                        >
                                                          {part}
                                                        </span>
                                                      );
                                                    } else if (
                                                      /\b[A-Z]{2,}\b/.test(part)
                                                    ) {
                                                      return (
                                                        <span
                                                          key={partIndex}
                                                          className="font-semibold text-blue-700"
                                                        >
                                                          {part}
                                                        </span>
                                                      );
                                                    } else {
                                                      return (
                                                        <span key={partIndex}>
                                                          {renderMarkdownText(
                                                            part,
                                                          )}
                                                        </span>
                                                      );
                                                    }
                                                  })}
                                              </span>
                                            </>
                                          ) : (
                                            <span className="leading-relaxed">
                                              {renderMarkdownText(line)}
                                            </span>
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>
                          {message.type === "user" && (
                            <div className="text-xs text-muted-foreground mt-1 px-1">
                              {message.timestamp.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </div>
                          )}
                          {message.type === "assistant" && (
                            <div className="text-xs text-muted-foreground mt-1 px-1">
                              {message.timestamp.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </div>
                          )}
                        </div>

                        {message.type === "user" && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
                              <img
                                src={userIcon}
                                alt="User"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {queryMutation.isPending && (
                      <div
                        className="flex items-start gap-3 mb-5"
                        data-testid="loading-message"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
                            <img
                              src={bot}
                              alt="Bot"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="bg-purple-50 text-gray-900 px-5 py-3 rounded-2xl shadow-sm break-words">
                          <p className="text-sm">Processing your query...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div
                className="border-t border-border p-4 flex-shrink-0"
                data-testid="input-area"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      placeholder="Type your instructions for the assistant right here..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="h-12 text-[15px] border border-gray-300 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 bg-white rounded-xl px-4 transition-colors"
                      data-testid="input-message"
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={queryMutation.isPending || !query.trim()}
                    size="lg"
                    className="h-12 px-6 bg-primary hover:bg-primary/90 rounded-xl"
                    data-testid="button-send"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Query Processing Status Section */}
          <div className="flex-shrink-0">
            <ProcessingStatusDisplay />
          </div>
        </div>

        </div>
    </div>
  );
};

export default NLQInterface;
