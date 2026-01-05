import express from "express";
import { spawn } from "child_process";
import path from "path";
import { createServer } from "vite";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { personaAutomationServices, getAutomationServiceForQuery, AutomationServiceId } from "./data/automationServices";

const app = express();
let pythonProcess: any = null;

// Query analytics tracker - in-memory store for real-time analytics
interface QueryLog {
  id: string;
  query: string;
  persona: string;
  timestamp: Date;
  type: 'invoice' | 'approval' | 'status' | 'data' | 'general';
  category: string;
  status: 'completed' | 'processing' | 'failed';
  responseTime?: number; // in seconds
  sentiment?: 'positive' | 'neutral' | 'negative';
  user?: string;
  avatar?: string;
  automationService?: AutomationServiceId; // Automation service type
}

const queryLogs: QueryLog[] = [];
let sessionCount = 0;
let activeConversations = 0;

// User avatars for mock data
const userAvatars = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍🔬', '👨‍🎨'];
const userNames = ['Guy Hawkins', 'Jane Cooper', 'Jacob Jones', 'Cody Fisher', 'Sarah Williams'];

// Add middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MSAL configuration for service principal (only initialize if credentials are available)
let cca: ConfidentialClientApplication | null = null;

if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID) {
  const msalConfig = {
    auth: {
      clientId: process.env.AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  };
  cca = new ConfidentialClientApplication(msalConfig);
  console.log("✅ Azure MSAL client initialized");
} else {
  console.warn("⚠️  Azure credentials not configured - Power BI features will be disabled");
}

// Start the Python Flask application
function startPythonApp() {
  console.log("🐍 Starting Python Flask backend...");
  
  pythonProcess = spawn('python3', ['server/app.py'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
    env: { ...process.env, PROXY_MODE: 'true' }
  });

  pythonProcess.stdout.on('data', (data: Buffer) => {
    console.log(`[Python] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data: Buffer) => {
    console.error(`[Python] ${data.toString().trim()}`);
  });

  pythonProcess.on('close', (code: number) => {
    console.log(`Python process exited with code ${code}`);
  });

  pythonProcess.on('error', (error: Error) => {
    console.error('Failed to start Python process:', error);
  });
}

// Handle bare /api routes before proxying
app.all(["/api", "/api/"], (req, res) => {
  // Add cache-busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  if (req.method === 'HEAD') {
    return res.status(204).end();
  }
  return res.status(200).json({
    status: 'ok',
    service: 'Node proxy',
    endpoints: ['/api/process-nlq', '/api/generate-sql', '/api/config-status', '/health']
  });
});

// Add a cache clearing endpoint
app.post('/api/clear-cache', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Cache clearing instruction sent',
    timestamp: new Date().toISOString()
  });
});

// Power BI embed token endpoint
app.post('/api/powerbi/embed-token', async (req, res) => {
  try {
    const { reportId, groupId } = req.body;

    // Check if MSAL client is available
    if (!cca) {
      return res.status(503).json({
        error: 'Power BI not configured',
        details: 'Azure credentials are not configured. Please set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID environment variables.'
      });
    }

    // Validate required parameters
    if (!reportId || !groupId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'Both reportId and groupId are required for embed token generation'
      });
    }

    console.log(`Generating Power BI embed token for report: ${reportId}, workspace: ${groupId}`);
    console.log(`Using Azure Client ID: ${process.env.AZURE_CLIENT_ID}`);
    console.log(`Using Azure Tenant ID: ${process.env.AZURE_TENANT_ID}`);

    // Get access token using service principal
    const tokenResponse = await cca.acquireTokenByClientCredential({
      scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    });

    if (!tokenResponse || !tokenResponse.accessToken) {
      console.error('Failed to acquire access token from Azure AD');
      return res.status(500).json({ error: 'Failed to acquire access token' });
    }

    const accessToken = tokenResponse.accessToken;
    console.log('Successfully acquired Azure AD access token');
    console.log('Token length:', accessToken.length);
    console.log('Token expires:', tokenResponse.expiresOn);

    // Generate embed token using Power BI REST API
    const embedTokenUrl = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`;

    const embedTokenResponse = await fetch(embedTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessLevel: 'View',
      }),
    });

    if (!embedTokenResponse.ok) {
      const errorText = await embedTokenResponse.text();
      console.error('Power BI API error:');
      console.error('  Status:', embedTokenResponse.status);
      console.error('  Response:', errorText);
      console.error('  Request URL:', embedTokenUrl);
      console.error('  Report ID:', reportId);
      console.error('  Workspace ID:', groupId);
      
      // Parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('  Error Code:', errorJson?.error?.code);
        console.error('  Error Message:', errorJson?.error?.message);
      } catch (e) {
        // Not JSON, already logged as text
      }
      
      return res.status(embedTokenResponse.status).json({ 
        error: 'Failed to generate embed token',
        details: errorText,
        debugInfo: {
          reportId,
          groupId,
          status: embedTokenResponse.status
        }
      });
    }

    const embedTokenData = await embedTokenResponse.json();
    console.log('Successfully generated Power BI embed token');

    res.json({
      embedToken: embedTokenData.token,
      embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${groupId}`,
      expiration: embedTokenData.expiration,
    });
  } catch (error) {
    console.error('Error generating Power BI embed token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GenAI Suite Invoice Data API - Returns real invoice data from the dashboard
app.get('/api/genai-invoices', (req, res) => {
  const { status, type, customer, vendor } = req.query;
  
  // Real Accounts Payable invoice data from GenAI Suite Finance Automation Dashboard
  const apInvoices = [
    {
      id: 'INV-24-5847',
      vendor: 'Office Supplies Inc.',
      amount: 1250.00,
      status: 'posted',
      processingTime: '1.2 min',
      exceptions: 'Clean',
      issueDate: '2024-10-01',
      dueDate: '2024-10-15',
      type: 'payable'
    },
    {
      id: 'INV-24-5848',
      vendor: 'Tech Solutions Ltd.',
      amount: 15800.00,
      status: 'pending approval',
      processingTime: '3.4 min',
      exceptions: 'Price Variance: 8%',
      issueDate: '2024-10-04',
      dueDate: '2024-10-18',
      type: 'payable'
    },
    {
      id: 'INV-24-5849',
      vendor: 'Consulting Services Co.',
      amount: 12450.00,
      status: 'exception',
      processingTime: '2.1 min',
      exceptions: 'Missing PO, New Vendor',
      issueDate: '2024-10-05',
      dueDate: '2024-10-19',
      type: 'payable'
    },
    {
      id: 'INV-24-5850',
      vendor: 'Marketing Agency Pro.',
      amount: 8900.00,
      status: 'validating',
      processingTime: '0.8 min',
      exceptions: 'Clean',
      issueDate: '2024-10-06',
      dueDate: '2024-10-20',
      type: 'payable'
    }
  ];
  
  // Real Accounts Receivable invoice data from GenAI Suite Finance Automation Dashboard
  const arInvoices = [
    {
      id: 'INV-AR-24-2847',
      customer: 'TechCorp Solutions',
      amount: 24750.00,
      status: 'paid',
      dueDate: '2025-09-15',
      type: 'receivable'
    },
    {
      id: 'INV-AR-24-2848',
      customer: 'Manufacturing Plus',
      amount: 18900.00,
      status: 'overdue',
      dueDate: '2025-10-08',
      type: 'receivable'
    },
    {
      id: 'INV-AR-24-2849',
      customer: 'Global Retailers Inc',
      amount: 45200.00,
      status: 'disputed',
      dueDate: '2025-07-10',
      type: 'receivable'
    },
    {
      id: 'INV-AR-24-2850',
      customer: 'Service Dynamics',
      amount: 12350.00,
      status: 'pending',
      dueDate: '2025-09-20',
      type: 'receivable'
    }
  ];
  
  // Combine or select invoices based on type
  let allInvoices = type === 'receivable' ? arInvoices : (type === 'payable' ? apInvoices : [...apInvoices, ...arInvoices]);
  
  // Filter by customer name if provided (for AR invoices)
  if (customer && typeof customer === 'string') {
    allInvoices = allInvoices.filter(inv => 
      'customer' in inv && inv.customer.toLowerCase().includes(customer.toLowerCase())
    );
  }
  
  // Filter by vendor name if provided (for AP invoices)
  if (vendor && typeof vendor === 'string') {
    allInvoices = allInvoices.filter(inv => 
      'vendor' in inv && inv.vendor.toLowerCase().includes(vendor.toLowerCase())
    );
  }
  
  // Filter by status if provided
  if (status && typeof status === 'string') {
    allInvoices = allInvoices.filter(inv => inv.status.toLowerCase() === status.toLowerCase());
  }
  
  const total = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  res.json({
    invoices: allInvoices,
    summary: {
      count: allInvoices.length,
      total: total,
      status: status || 'all',
      type: type || 'all'
    }
  });
});

// Authentication endpoint - Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // Check credentials
  if (email === 'admin@scodac.com' && password === 'scodac@ai$123') {
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        email: 'admin@scodac.com',
        name: 'SCODAC Admin'
      }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
});

// Authentication endpoint - Forgot Password
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  
  // Validate required field
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  // Check if email is the allowed forgot password email
  if (email === 'admin@demo.com') {
    return res.status(200).json({
      success: true,
      message: 'Password reset instructions have been sent to your email address'
    });
  } else {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email address'
    });
  }
});

// Dashboard Metrics API - Returns persona-specific metrics
app.get('/api/dashboard/metrics', (req, res) => {
  const { persona } = req.query;
  
  const personaMetrics: Record<string, any> = {
    'customer-service': {
      balance: 37562.00,
      metrics: [
        { label: 'Tickets Resolved', value: 2567, change: '+12%', trend: 'up', regions: 100 },
        { label: 'Customer Satisfaction', value: '94%', change: '+5%', trend: 'up', subtitle: 'Quarter 2/3' },
        { label: 'Avg Response Time', value: '2.3h', change: '-18%', trend: 'up', subtitle: '85% Rate' },
        { label: 'Escalations', value: 124, change: '-8%', trend: 'down', subtitle: '3050 Prevented' }
      ]
    },
    'it': {
      balance: 42890.00,
      metrics: [
        { label: 'System Uptime', value: '99.8%', change: '+0.2%', trend: 'up', regions: 120 },
        { label: 'Incidents Resolved', value: 1834, change: '+15%', trend: 'up', subtitle: 'Quarter 2/3' },
        { label: 'Avg Resolution Time', value: '1.8h', change: '-22%', trend: 'up', subtitle: '92% Rate' },
        { label: 'Security Alerts', value: 56, change: '-12%', trend: 'down', subtitle: '2180 Prevented' }
      ]
    },
    'finance-accounting': {
      balance: 87234.00,
      metrics: [
        { label: 'Invoices Processed', value: 3456, change: '+18%', trend: 'up', regions: 150 },
        { label: 'Revenue Growth', value: '23%', change: '+7%', trend: 'up', subtitle: 'Quarter 2/3' },
        { label: 'Processing Time', value: '1.2d', change: '-25%', trend: 'up', subtitle: '88% Rate' },
        { label: 'Exceptions', value: 89, change: '-15%', trend: 'down', subtitle: '4200 Clean' }
      ]
    },
    'sales': {
      balance: 124567.00,
      metrics: [
        { label: 'Deals Closed', value: 1234, change: '+28%', trend: 'up', regions: 200 },
        { label: 'Conversion Rate', value: '32%', change: '+9%', trend: 'up', subtitle: 'Quarter 2/3' },
        { label: 'Sales Cycle', value: '14d', change: '-12%', trend: 'up', subtitle: '75% Rate' },
        { label: 'Churn Rate', value: '2.1%', change: '-0.5%', trend: 'down', subtitle: '890 Retained' }
      ]
    },
    'human-resources': {
      balance: 52890.00,
      metrics: [
        { label: 'New Hires', value: 234, change: '+14%', trend: 'up', regions: 80 },
        { label: 'Employee Retention', value: '94%', change: '+3%', trend: 'up', subtitle: 'Quarter 2/3' },
        { label: 'Time to Hire', value: '21d', change: '-8%', trend: 'up', subtitle: '89% Rate' },
        { label: 'Open Positions', value: 45, change: '-10%', trend: 'down', subtitle: '189 Filled' }
      ]
    }
  };
  
  const defaultMetrics = personaMetrics['customer-service'];
  const metrics = personaMetrics[persona as string] || defaultMetrics;
  
  res.json(metrics);
});

// Dashboard Analytics API - Returns usage and analytics data
app.get('/api/dashboard/analytics', (req, res) => {
  const { persona, period = 'year' } = req.query;
  
  const monthlyData = [
    { month: 'Feb', statistics: 42, orders: 38, transactions: 25, customers: 32 },
    { month: 'Mar', statistics: 55, orders: 52, transactions: 48, customers: 45 },
    { month: 'Apr', statistics: 52, orders: 55, transactions: 52, customers: 50 },
    { month: 'May', statistics: 48, orders: 48, transactions: 62, customers: 48 },
    { month: 'Jun', statistics: 56, orders: 52, transactions: 58, customers: 52 },
    { month: 'Jul', statistics: 52, orders: 50, transactions: 72, customers: 58 }
  ];
  
  const personaActivities: Record<string, any[]> = {
    'customer-service': [
      { time: '08:42', status: 'completed', text: 'Customer ticket #2356 resolved', category: 'support' },
      { time: '10:00', status: 'active', text: 'Team meeting scheduled', category: 'meeting' },
      { time: '14:37', status: 'urgent', text: 'Escalation: Priority customer issue', category: 'escalation' },
      { time: '16:50', status: 'completed', text: 'Customer satisfaction survey completed', category: 'feedback' }
    ],
    'it': [
      { time: '09:15', status: 'completed', text: 'Server maintenance completed', category: 'maintenance' },
      { time: '11:30', status: 'active', text: 'Security patch deployment', category: 'security' },
      { time: '13:45', status: 'urgent', text: 'Network outage reported', category: 'incident' },
      { time: '15:20', status: 'completed', text: 'Database backup verified', category: 'backup' }
    ],
    'finance-accounting': [
      { time: '08:30', status: 'completed', text: 'Monthly reports generated', category: 'reporting' },
      { time: '10:45', status: 'active', text: 'Invoice approval workflow', category: 'approval' },
      { time: '14:20', status: 'urgent', text: 'Payment discrepancy flagged', category: 'exception' },
      { time: '16:15', status: 'completed', text: 'Quarterly reconciliation done', category: 'reconciliation' }
    ],
    'sales': [
      { time: '09:00', status: 'completed', text: 'New deal pipeline created', category: 'opportunity' },
      { time: '11:15', status: 'active', text: 'Client presentation scheduled', category: 'meeting' },
      { time: '14:50', status: 'urgent', text: 'Major deal at risk', category: 'alert' },
      { time: '16:30', status: 'completed', text: 'Contract signed and closed', category: 'closed' }
    ],
    'human-resources': [
      { time: '08:45', status: 'completed', text: 'New employee onboarding started', category: 'onboarding' },
      { time: '10:30', status: 'active', text: 'Performance review cycle', category: 'review' },
      { time: '13:15', status: 'urgent', text: 'Employee concern escalated', category: 'hr-issue' },
      { time: '15:45', status: 'completed', text: 'Training program completed', category: 'training' }
    ]
  };
  
  const defaultActivities = personaActivities['customer-service'];
  const activities = personaActivities[persona as string] || defaultActivities;
  
  res.json({
    charts: monthlyData,
    activities,
    summary: {
      totalRecords: 1050,
      avgPerformance: 94.5,
      trend: 'positive'
    }
  });
});

// Dashboard Feedback API - Returns feedback and requests
app.get('/api/dashboard/feedback', (req, res) => {
  const { persona } = req.query;
  
  const personaFeedback: Record<string, any[]> = {
    'customer-service': [
      { 
        id: '1', 
        author: 'Sarah Johnson', 
        avatar: 'SJ',
        time: 'Yesterday at 5:06 PM', 
        content: 'The new ticket routing system has significantly reduced our response time. Great improvement!',
        likes: 12,
        comments: 150,
        status: 'approved'
      },
      { 
        id: '2', 
        author: 'Mike Chen', 
        avatar: 'MC',
        time: '2 days ago', 
        content: 'Request: Need better integration with our CRM for customer history access.',
        likes: 22,
        comments: 58,
        status: 'in-review'
      }
    ],
    'it': [
      { 
        id: '1', 
        author: 'David Kumar', 
        avatar: 'DK',
        time: 'Yesterday at 3:15 PM', 
        content: 'Automated server monitoring has been excellent. Catching issues before they become critical.',
        likes: 18,
        comments: 42,
        status: 'approved'
      },
      { 
        id: '2', 
        author: 'Lisa Wang', 
        avatar: 'LW',
        time: '3 days ago', 
        content: 'Request: Add support for multi-cloud infrastructure monitoring.',
        likes: 31,
        comments: 67,
        status: 'planned'
      }
    ],
    'finance-accounting': [
      { 
        id: '1', 
        author: 'Robert Martinez', 
        avatar: 'RM',
        time: 'Yesterday at 4:30 PM', 
        content: 'Invoice automation has cut processing time by 60%. Exceptional results!',
        likes: 28,
        comments: 95,
        status: 'approved'
      },
      { 
        id: '2', 
        author: 'Emily Brown', 
        avatar: 'EB',
        time: '1 day ago', 
        content: 'Request: Need better exception handling for international invoices.',
        likes: 19,
        comments: 44,
        status: 'in-review'
      }
    ],
    'sales': [
      { 
        id: '1', 
        author: 'Tom Anderson', 
        avatar: 'TA',
        time: 'Yesterday at 2:45 PM', 
        content: 'Lead scoring automation is helping us focus on high-value opportunities.',
        likes: 34,
        comments: 78,
        status: 'approved'
      },
      { 
        id: '2', 
        author: 'Rachel Green', 
        avatar: 'RG',
        time: '2 days ago', 
        content: 'Request: Add predictive analytics for deal closure probability.',
        likes: 41,
        comments: 102,
        status: 'planned'
      }
    ],
    'human-resources': [
      { 
        id: '1', 
        author: 'James Wilson', 
        avatar: 'JW',
        time: 'Yesterday at 1:20 PM', 
        content: 'Onboarding automation has made new hire setup seamless. Love it!',
        likes: 15,
        comments: 36,
        status: 'approved'
      },
      { 
        id: '2', 
        author: 'Anna Lee', 
        avatar: 'AL',
        time: '3 days ago', 
        content: 'Request: Need better integration with benefits management system.',
        likes: 23,
        comments: 51,
        status: 'in-review'
      }
    ]
  };
  
  const defaultFeedback = personaFeedback['customer-service'];
  const feedback = personaFeedback[persona as string] || defaultFeedback;
  
  res.json({
    feedback,
    stats: {
      total: feedback.length,
      approved: feedback.filter(f => f.status === 'approved').length,
      pending: feedback.filter(f => f.status === 'in-review').length
    }
  });
});

// Dashboard Agents Repository API - Returns available automation agents
app.get('/api/dashboard/agents', (req, res) => {
  const { persona } = req.query;
  
  const personaAgents: Record<string, any[]> = {
    'customer-service': [
      { 
        id: '1', 
        name: 'Ticket Router', 
        category: 'Support Automation',
        description: 'Automatically routes tickets based on content, urgency, and agent expertise',
        status: 'active',
        usage: 2847,
        accuracy: 96.5,
        timeSaved: '420 hrs/month',
        models: [
          { id: 'm1', name: 'AWS Comprehend', provider: 'AWS', type: 'nlp', accuracy: 96.8, latency: '120ms' },
          { id: 'm2', name: 'Azure Text Analytics', provider: 'Azure', type: 'nlp', accuracy: 95.4, latency: '95ms' },
          { id: 'm3', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', type: 'nlp', accuracy: 97.2, latency: '250ms' },
          { id: 'm4', name: 'Gemini Pro', provider: 'GCP', type: 'nlp', accuracy: 96.1, latency: '180ms' }
        ]
      },
      { 
        id: '2', 
        name: 'Sentiment Analyzer', 
        category: 'Customer Intelligence',
        description: 'Analyzes customer sentiment in real-time to prioritize urgent cases',
        status: 'active',
        usage: 3124,
        accuracy: 94.2,
        timeSaved: '180 hrs/month',
        models: [
          { id: 'm5', name: 'AWS Comprehend Sentiment', provider: 'AWS', type: 'nlp', accuracy: 94.5, latency: '85ms' },
          { id: 'm6', name: 'Azure Sentiment Analysis', provider: 'Azure', type: 'nlp', accuracy: 93.8, latency: '110ms' },
          { id: 'm7', name: 'GPT-4o', provider: 'OpenAI', type: 'nlp', accuracy: 95.2, latency: '320ms' }
        ]
      },
      { 
        id: '3', 
        name: 'Response Suggester', 
        category: 'Agent Assist',
        description: 'Provides AI-powered response suggestions based on ticket context',
        status: 'beta',
        usage: 1567,
        accuracy: 91.8,
        timeSaved: '290 hrs/month',
        models: [
          { id: 'm8', name: 'GPT-4 Turbo', provider: 'OpenAI', type: 'nlp', accuracy: 92.4, latency: '410ms' },
          { id: 'm9', name: 'Claude 3 Opus', provider: 'Anthropic', type: 'nlp', accuracy: 93.1, latency: '380ms' },
          { id: 'm10', name: 'Gemini Ultra', provider: 'GCP', type: 'nlp', accuracy: 91.5, latency: '290ms' }
        ]
      }
    ],
    'it': [
      { 
        id: '1', 
        name: 'Incident Detector', 
        category: 'System Monitoring',
        description: 'Proactively detects system anomalies and potential incidents',
        status: 'active',
        usage: 4521,
        accuracy: 98.1,
        timeSaved: '650 hrs/month',
        models: [
          { id: 'm11', name: 'AWS CloudWatch Anomaly Detection', provider: 'AWS', type: 'data', accuracy: 98.3, latency: '45ms' },
          { id: 'm12', name: 'Azure Monitor ML', provider: 'Azure', type: 'data', accuracy: 97.9, latency: '60ms' },
          { id: 'm13', name: 'GCP Operations AI', provider: 'GCP', type: 'data', accuracy: 98.5, latency: '55ms' }
        ]
      },
      { 
        id: '2', 
        name: 'Patch Manager', 
        category: 'Security Automation',
        description: 'Automates security patch deployment with rollback capabilities',
        status: 'active',
        usage: 1893,
        accuracy: 99.3,
        timeSaved: '380 hrs/month',
        models: [
          { id: 'm14', name: 'AWS Systems Manager', provider: 'AWS', type: 'data', accuracy: 99.5, latency: '200ms' },
          { id: 'm15', name: 'Azure Automation', provider: 'Azure', type: 'data', accuracy: 99.1, latency: '180ms' },
          { id: 'm16', name: 'GCP VM Manager', provider: 'GCP', type: 'data', accuracy: 99.4, latency: '190ms' }
        ]
      },
      { 
        id: '3', 
        name: 'Resource Optimizer', 
        category: 'Infrastructure',
        description: 'Optimizes cloud resource allocation based on usage patterns',
        status: 'active',
        usage: 2456,
        accuracy: 95.7,
        timeSaved: '520 hrs/month',
        models: [
          { id: 'm17', name: 'AWS Compute Optimizer', provider: 'AWS', type: 'data', accuracy: 96.2, latency: '150ms' },
          { id: 'm18', name: 'Azure Advisor', provider: 'Azure', type: 'data', accuracy: 95.4, latency: '140ms' },
          { id: 'm19', name: 'GCP Recommender', provider: 'GCP', type: 'data', accuracy: 95.9, latency: '135ms' }
        ]
      }
    ],
    'finance-accounting': [
      { 
        id: '1', 
        name: 'Invoice Processor', 
        category: 'AP Automation',
        description: 'Extracts and validates invoice data with intelligent matching',
        status: 'active',
        usage: 5234,
        accuracy: 97.8,
        timeSaved: '840 hrs/month',
        models: [
          { id: 'm20', name: 'AWS Textract', provider: 'AWS', type: 'document', accuracy: 98.1, latency: '280ms' },
          { id: 'm21', name: 'Azure Form Recognizer', provider: 'Azure', type: 'document', accuracy: 97.6, latency: '310ms' },
          { id: 'm22', name: 'Google Document AI', provider: 'GCP', type: 'document', accuracy: 97.9, latency: '295ms' },
          { id: 'm23', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', type: 'nlp', accuracy: 98.3, latency: '420ms' }
        ]
      },
      { 
        id: '2', 
        name: 'Expense Categorizer', 
        category: 'Financial Intelligence',
        description: 'Automatically categorizes expenses using ML classification',
        status: 'active',
        usage: 3892,
        accuracy: 96.2,
        timeSaved: '420 hrs/month',
        models: [
          { id: 'm24', name: 'AWS SageMaker Classifier', provider: 'AWS', type: 'data', accuracy: 96.5, latency: '95ms' },
          { id: 'm25', name: 'Azure ML AutoML', provider: 'Azure', type: 'data', accuracy: 96.0, latency: '110ms' },
          { id: 'm26', name: 'GPT-4o mini', provider: 'OpenAI', type: 'nlp', accuracy: 96.8, latency: '180ms' }
        ]
      },
      { 
        id: '3', 
        name: 'Reconciliation Bot', 
        category: 'Account Management',
        description: 'Performs automated account reconciliation with exception handling',
        status: 'active',
        usage: 2147,
        accuracy: 98.5,
        timeSaved: '610 hrs/month',
        models: [
          { id: 'm27', name: 'AWS Fraud Detector', provider: 'AWS', type: 'data', accuracy: 98.7, latency: '150ms' },
          { id: 'm28', name: 'Azure Anomaly Detector', provider: 'Azure', type: 'data', accuracy: 98.3, latency: '125ms' },
          { id: 'm29', name: 'GPT-4 Turbo', provider: 'OpenAI', type: 'nlp', accuracy: 98.9, latency: '380ms' }
        ]
      }
    ],
    'sales': [
      { 
        id: '1', 
        name: 'Lead Scorer', 
        category: 'Lead Management',
        description: 'Scores leads based on engagement, fit, and conversion probability',
        status: 'active',
        usage: 4156,
        accuracy: 93.4,
        timeSaved: '520 hrs/month',
        models: [
          { id: 'm30', name: 'AWS SageMaker Predictor', provider: 'AWS', type: 'data', accuracy: 93.8, latency: '75ms' },
          { id: 'm31', name: 'Azure ML Studio', provider: 'Azure', type: 'data', accuracy: 93.2, latency: '85ms' },
          { id: 'm32', name: 'Vertex AI Predictions', provider: 'GCP', type: 'data', accuracy: 93.6, latency: '80ms' }
        ]
      },
      { 
        id: '2', 
        name: 'Proposal Generator', 
        category: 'Sales Automation',
        description: 'Creates customized proposals using AI and historical data',
        status: 'active',
        usage: 2893,
        accuracy: 91.7,
        timeSaved: '670 hrs/month',
        models: [
          { id: 'm33', name: 'GPT-4 Turbo', provider: 'OpenAI', type: 'nlp', accuracy: 92.1, latency: '520ms' },
          { id: 'm34', name: 'Claude 3 Opus', provider: 'Anthropic', type: 'nlp', accuracy: 92.5, latency: '480ms' },
          { id: 'm35', name: 'Gemini Pro', provider: 'GCP', type: 'nlp', accuracy: 91.4, latency: '410ms' }
        ]
      },
      { 
        id: '3', 
        name: 'Pipeline Predictor', 
        category: 'Sales Intelligence',
        description: 'Predicts deal outcomes and suggests next-best actions',
        status: 'beta',
        usage: 1678,
        accuracy: 89.5,
        timeSaved: '390 hrs/month',
        models: [
          { id: 'm36', name: 'AWS Forecast', provider: 'AWS', type: 'data', accuracy: 89.9, latency: '180ms' },
          { id: 'm37', name: 'Azure Time Series Insights', provider: 'Azure', type: 'data', accuracy: 89.2, latency: '165ms' },
          { id: 'm38', name: 'GPT-4o', provider: 'OpenAI', type: 'nlp', accuracy: 90.1, latency: '350ms' }
        ]
      }
    ],
    'human-resources': [
      { 
        id: '1', 
        name: 'Resume Screener', 
        category: 'Recruitment',
        description: 'Screens resumes and ranks candidates based on job requirements',
        status: 'active',
        usage: 3421,
        accuracy: 94.8,
        timeSaved: '580 hrs/month',
        models: [
          { id: 'm39', name: 'AWS Textract', provider: 'AWS', type: 'document', accuracy: 95.2, latency: '240ms' },
          { id: 'm40', name: 'Azure Cognitive Search', provider: 'Azure', type: 'nlp', accuracy: 94.5, latency: '195ms' },
          { id: 'm41', name: 'GPT-4o', provider: 'OpenAI', type: 'nlp', accuracy: 95.6, latency: '380ms' }
        ]
      },
      { 
        id: '2', 
        name: 'Onboarding Assistant', 
        category: 'Employee Experience',
        description: 'Automates new hire paperwork and training assignments',
        status: 'active',
        usage: 1234,
        accuracy: 97.2,
        timeSaved: '340 hrs/month',
        models: [
          { id: 'm42', name: 'AWS Comprehend', provider: 'AWS', type: 'nlp', accuracy: 97.5, latency: '140ms' },
          { id: 'm43', name: 'Azure Form Recognizer', provider: 'Azure', type: 'document', accuracy: 97.0, latency: '260ms' },
          { id: 'm44', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', type: 'nlp', accuracy: 97.8, latency: '310ms' }
        ]
      },
      { 
        id: '3', 
        name: 'Performance Tracker', 
        category: 'Performance Management',
        description: 'Tracks employee KPIs and generates performance insights',
        status: 'active',
        usage: 2567,
        accuracy: 92.6,
        timeSaved: '450 hrs/month',
        models: [
          { id: 'm45', name: 'AWS QuickSight ML', provider: 'AWS', type: 'data', accuracy: 92.9, latency: '120ms' },
          { id: 'm46', name: 'Azure Synapse Analytics', provider: 'Azure', type: 'data', accuracy: 92.4, latency: '130ms' },
          { id: 'm47', name: 'BigQuery ML', provider: 'GCP', type: 'data', accuracy: 92.7, latency: '115ms' }
        ]
      }
    ]
  };
  
  const defaultAgents = personaAgents['customer-service'];
  const agents = personaAgents[persona as string] || defaultAgents;
  
  res.json({
    agents,
    summary: {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      totalUsage: agents.reduce((sum, a) => sum + a.usage, 0),
      avgAccuracy: (agents.reduce((sum, a) => sum + a.accuracy, 0) / agents.length).toFixed(1)
    }
  });
});

// Helper function to analyze sentiment
function analyzeSentiment(query: string): 'positive' | 'neutral' | 'negative' {
  const lowerQuery = query.toLowerCase();
  
  // Negative indicators
  const negativeWords = ['error', 'failed', 'issue', 'problem', 'wrong', 'not working', 'broken'];
  if (negativeWords.some(word => lowerQuery.includes(word))) {
    return 'negative';
  }
  
  // Positive indicators (successful queries, completed actions)
  const positiveWords = ['success', 'complete', 'approved', 'paid', 'confirmed', 'show', 'view', 'get'];
  if (positiveWords.some(word => lowerQuery.includes(word))) {
    return 'positive';
  }
  
  // Default to positive for most queries (users asking questions tend to be satisfied when getting answers)
  return 'positive';
}

// Helper function to determine automation service type
function getAutomationService(query: string, persona: string): QueryLog['automationService'] {
  return getAutomationServiceForQuery(query, persona);
}

// Query logging endpoint - tracks user queries for analytics
app.post('/api/log-query', (req, res) => {
  const { query, persona = 'generic', responseTime } = req.body;
  
  // Validate query
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query is required and must be a non-empty string' });
  }
  
  // Categorize query
  const queryLower = query.toLowerCase();
  let type: QueryLog['type'] = 'general';
  let category = 'general';
  
  if (queryLower.includes('invoice') || queryLower.includes('invoices')) {
    type = 'invoice';
    category = 'invoice_management';
  } else if (queryLower.includes('approv') || queryLower.includes('pending')) {
    type = 'approval';
    category = 'approval_workflow';
  } else if (queryLower.includes('status') || queryLower.includes('state')) {
    type = 'status';
    category = 'status_inquiry';
  } else if (queryLower.includes('data') || queryLower.includes('report')) {
    type = 'data';
    category = 'data_query';
  }
  
  // Analyze sentiment
  const sentiment = analyzeSentiment(query);
  
  // Determine automation service
  const automationService = getAutomationService(query, persona);
  
  // Generate response time (use provided or simulate)
  const actualResponseTime = responseTime || (0.8 + Math.random() * 1.2); // 0.8-2.0 seconds
  
  // Assign random user for display
  const userIndex = queryLogs.length % userNames.length;
  
  // Create query log
  const log: QueryLog = {
    id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    query,
    persona,
    timestamp: new Date(),
    type,
    category,
    status: 'completed',
    responseTime: actualResponseTime,
    sentiment,
    user: userNames[userIndex],
    avatar: userAvatars[userIndex],
    automationService
  };
  
  queryLogs.push(log);
  
  // Keep only last 1000 queries
  if (queryLogs.length > 1000) {
    queryLogs.shift();
  }
  
  sessionCount++;
  
  res.json({ success: true, logId: log.id });
});

// Query analytics endpoint - returns real-time query data
app.get('/api/dashboard/query-analytics', (req, res) => {
  const { persona } = req.query;
  
  // Filter queries by persona if specified
  const relevantQueries = persona && persona !== 'generic'
    ? queryLogs.filter(q => q.persona === persona)
    : queryLogs;
  
  // Calculate metrics
  const totalQueries = relevantQueries.length;
  const last24Hours = relevantQueries.filter(q => 
    new Date().getTime() - new Date(q.timestamp).getTime() < 24 * 60 * 60 * 1000
  );
  
  // Group by type
  const queryTypeStats = {
    invoice: relevantQueries.filter(q => q.type === 'invoice').length,
    approval: relevantQueries.filter(q => q.type === 'approval').length,
    status: relevantQueries.filter(q => q.type === 'status').length,
    data: relevantQueries.filter(q => q.type === 'data').length,
    general: relevantQueries.filter(q => q.type === 'general').length
  };
  
  // Get recent queries for activity feed
  const recentQueries = relevantQueries
    .slice(-10)
    .reverse()
    .map(q => ({
      time: new Date(q.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: q.status,
      text: q.query.length > 60 ? q.query.substring(0, 60) + '...' : q.query,
      category: q.category
    }));
  
  // Generate monthly chart data (simulated based on recent queries)
  const monthlyData = [
    { month: 'Feb', queries: Math.floor(totalQueries * 0.7 + Math.random() * 10) },
    { month: 'Mar', queries: Math.floor(totalQueries * 0.8 + Math.random() * 10) },
    { month: 'Apr', queries: Math.floor(totalQueries * 0.85 + Math.random() * 10) },
    { month: 'May', queries: Math.floor(totalQueries * 0.9 + Math.random() * 10) },
    { month: 'Jun', queries: Math.floor(totalQueries * 0.95 + Math.random() * 10) },
    { month: 'Jul', queries: totalQueries }
  ];
  
  res.json({
    totalQueries,
    queries24h: last24Hours.length,
    sessions: sessionCount,
    activeConversations: Math.floor(last24Hours.length / 5) + 1,
    queryTypeStats,
    recentQueries,
    monthlyData,
    summary: {
      totalRecords: totalQueries,
      avgPerformance: last24Hours.length > 0 ? 95.2 : 0,
      trend: last24Hours.length > totalQueries * 0.1 ? 'positive' : 'stable'
    }
  });
});

// Chat history endpoint - returns recent chat sessions
app.get('/api/dashboard/chat-history', (req, res) => {
  const { persona, limit = '10' } = req.query;
  
  // Filter queries by persona if specified
  const relevantQueries = persona && persona !== 'generic'
    ? queryLogs.filter(q => q.persona === persona)
    : queryLogs;
  
  // Get recent chats with full details
  const limitNum = parseInt(limit as string) || 10;
  const recentChats = relevantQueries
    .slice(-limitNum)
    .reverse()
    .map(q => {
      const now = new Date();
      const queryTime = new Date(q.timestamp);
      const diffMinutes = Math.floor((now.getTime() - queryTime.getTime()) / (1000 * 60));
      
      let timeAgo = '';
      if (diffMinutes < 1) {
        timeAgo = 'Just now';
      } else if (diffMinutes < 60) {
        timeAgo = `${diffMinutes} min ago`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        timeAgo = `${hours} hr ago`;
      }
      
      return {
        id: q.id,
        user: q.user || 'Anonymous User',
        avatar: q.avatar || '👤',
        query: q.query,
        sentiment: q.sentiment || 'positive',
        responseTime: q.responseTime ? parseFloat(q.responseTime.toFixed(2)) : 1.2,
        timestamp: timeAgo,
        type: q.type
      };
    });
  
  res.json({ chats: recentChats });
});

// Chat metrics endpoint - returns response time and sentiment data
app.get('/api/dashboard/chat-metrics', (req, res) => {
  const { persona } = req.query;
  
  // Filter queries by persona if specified
  const relevantQueries = persona && persona !== 'generic'
    ? queryLogs.filter(q => q.persona === persona)
    : queryLogs;
  
  // Calculate average response time
  const responseTimes = relevantQueries
    .filter(q => q.responseTime)
    .map(q => q.responseTime!);
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 1.2;
  
  // Calculate sentiment distribution
  const sentimentCounts = {
    positive: relevantQueries.filter(q => q.sentiment === 'positive').length,
    neutral: relevantQueries.filter(q => q.sentiment === 'neutral').length,
    negative: relevantQueries.filter(q => q.sentiment === 'negative').length
  };
  
  const totalWithSentiment = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
  const sentimentPercentages = totalWithSentiment > 0 ? {
    positive: Math.round((sentimentCounts.positive / totalWithSentiment) * 100),
    neutral: Math.round((sentimentCounts.neutral / totalWithSentiment) * 100),
    negative: Math.round((sentimentCounts.negative / totalWithSentiment) * 100)
  } : { positive: 87, neutral: 10, negative: 3 }; // Default percentages
  
  // Generate hourly query volume data (last 24 hours)
  const now = new Date();
  const hourlyData = [];
  for (let i = 5; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
    const hourLabel = hour.toTimeString().substring(0, 5);
    const queriesInPeriod = relevantQueries.filter(q => {
      const qTime = new Date(q.timestamp);
      return qTime >= hour && qTime < new Date(hour.getTime() + 4 * 60 * 60 * 1000);
    }).length;
    hourlyData.push({ hour: hourLabel, queries: queriesInPeriod });
  }
  
  // Generate response time trend data
  const responseTimeTrend = [];
  for (let i = 5; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
    const hourLabel = hour.toTimeString().substring(0, 5);
    const queriesInPeriod = relevantQueries.filter(q => {
      const qTime = new Date(q.timestamp);
      return qTime >= hour && qTime < new Date(hour.getTime() + 4 * 60 * 60 * 1000) && q.responseTime;
    });
    const avgTime = queriesInPeriod.length > 0
      ? queriesInPeriod.reduce((sum, q) => sum + (q.responseTime || 0), 0) / queriesInPeriod.length
      : avgResponseTime;
    responseTimeTrend.push({ time: hourLabel, responseTime: parseFloat(avgTime.toFixed(2)) });
  }
  
  res.json({
    avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
    sentimentPercentages,
    sentimentCounts,
    queryVolumeData: hourlyData,
    responseTimeData: responseTimeTrend
  });
});

// Automation services breakdown endpoint - returns service-specific metrics
app.get('/api/dashboard/automation-services', (req, res) => {
  const { persona } = req.query;
  
  // Handle generic persona - use customer-service as default template
  const personaKey = (!persona || persona === 'generic') 
    ? 'customer-service' 
    : (persona as string);
  
  // Filter queries by persona if specified
  const relevantQueries = (!persona || persona === 'generic')
    ? queryLogs
    : queryLogs.filter(q => q.persona === persona);
  
  // Get persona configuration
  const personaConfig = personaAutomationServices[personaKey];
  
  if (!personaConfig) {
    // Fallback to customer-service if persona config not found
    const fallbackConfig = personaAutomationServices['customer-service'];
    if (!fallbackConfig) {
      return res.status(400).json({ error: 'Invalid persona' });
    }
    return res.json({
      services: fallbackConfig.defaults || [],
      totals: {
        totalTimeSavedHours: 0,
        totalCostSaved: 0
      }
    });
  }
  
  // Count queries by automation service
  const serviceCounts: Record<string, number> = {};
  personaConfig.services.forEach(service => {
    serviceCounts[service.id] = relevantQueries.filter(
      q => q.automationService === service.id
    ).length;
  });
  
  // Build service metrics from real query data
  let services = personaConfig.services.map(config => {
    const count = serviceCounts[config.id] || 0;
    const timeSaved = count * config.avgTimePerQuery; // in minutes
    const costSaved = count * config.avgCostPerQuery; // in dollars
    
    return {
      id: config.id,
      name: config.name,
      fullName: config.fullName,
      description: config.description,
      icon: config.icon,
      queriesProcessed: count,
      timeSavedMinutes: timeSaved,
      timeSavedHours: parseFloat((timeSaved / 60).toFixed(1)),
      costSaved: costSaved,
      avgResponseTime: relevantQueries
        .filter(q => q.automationService === config.id && q.responseTime)
        .reduce((sum, q, _, arr) => sum + (q.responseTime || 0) / arr.length, 0)
        .toFixed(2) || '1.48',
      accuracy: 95 + Math.random() * 4, // 95-99% accuracy simulation
      division: config.division || 'General Services',
      trend: count > 0 ? 'up' : 'stable',
      delta: Math.floor(Math.random() * 30) - 10, // Random delta between -10 and 20
      weeklyTrend: [] as number[] // Empty for real data
    };
  }).filter(service => service.queriesProcessed > 0); // Only show services with queries
  
  // If no queries exist, provide persona-specific dummy data
  if (services.length === 0 && personaConfig.defaults) {
    services = personaConfig.defaults;
  }
  
  // Calculate totals
  const totals = {
    totalQueries: services.length > 0 ? services.reduce((sum, s) => sum + s.queriesProcessed, 0) : relevantQueries.length,
    totalTimeSavedHours: parseFloat((services.reduce((sum, s) => sum + s.timeSavedHours, 0)).toFixed(1)),
    totalCostSaved: services.reduce((sum, s) => sum + s.costSaved, 0),
    servicesActive: services.length
  };
  
  res.json({
    services,
    totals
  });
});

// Proxy API requests to Python Flask backend
app.use('/api/', async (req, res) => {
  try {
    const url = `http://localhost:8000${req.originalUrl}`;
    const method = req.method;
    const headers = { ...req.headers };
    delete headers.host; // Remove host header to avoid conflicts
    delete headers['content-length']; // Let fetch calculate this
    
    const fetchOptions: RequestInit = {
      method,
      headers: headers as HeadersInit,
    };
    
    if (method !== 'GET' && method !== 'HEAD' && req.body !== undefined) {
      fetchOptions.body = JSON.stringify(req.body);
      (fetchOptions.headers as any)['content-type'] = 'application/json';
    }
    
    const response = await fetch(url, fetchOptions);
    const data = await response.text();
    
    res.status(response.status);
    
    // Add cache-busting headers to all API responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    response.headers.forEach((value, key) => {
      // Skip problematic headers that can cause issues
      if (!['connection', 'transfer-encoding', 'content-encoding', 'content-length'].includes(key.toLowerCase())) {
        res.set(key, value);
      }
    });
    res.send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(503).json({ error: 'Backend service unavailable' });
  }
});

// Proxy health check to Python backend
app.get('/health', async (req, res) => {
  // Add cache-busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache', 
    'Expires': '0'
  });
  
  try {
    const response = await fetch('http://localhost:8000/health');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ status: 'error', message: 'Python backend not available' });
  }
});

// Setup Vite dev server for React frontend
async function setupViteServer() {
  const vite = await createServer({
    server: { 
      middlewareMode: true,
      allowedHosts: true
    },
    appType: "custom",
    root: path.resolve(process.cwd(), "client"),
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "client", "src"),
        "@shared": path.resolve(process.cwd(), "shared"),
        "@assets": path.resolve(process.cwd(), "attached_assets"),
      },
    },
  });

  // Let Vite middleware handle assets first
  app.use(vite.middlewares);
  
  // SPA fallback - serve index.html for HTML navigation requests
  app.use(async (req, res, next) => {
    // Only handle HTML requests, let everything else pass through
    if ((req.method !== 'GET' && req.method !== 'HEAD') || 
        req.path.startsWith('/api') || 
        req.path === '/health') {
      return next();
    }
    
    // Only serve HTML for navigation requests (Accept: text/html)
    const acceptsHtml = (req.headers.accept || '').includes('text/html');
    if (!acceptsHtml) {
      return next();
    }
    
    try {
      console.log(`[${new Date().toISOString()}] Serving HTML for: ${req.originalUrl}`);
      const fs = await import('fs/promises');
      const indexPath = path.resolve(process.cwd(), 'client/index.html');
      let template = await fs.readFile(indexPath, 'utf-8');
      
      // Use Vite transformation for proper HMR
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      console.error('Frontend serving error:', e);
      vite.ssrFixStacktrace(e as Error);
      res.status(500).end(`Frontend error: ${(e as Error).message}`);
    }
  });
  
  console.log("✅ Vite dev server setup complete - serving React frontend");
}

// Function to check if Python backend is ready
async function waitForPythonBackend(maxWaitTime = 30000, checkInterval = 1000) {
  console.log("🔍 Waiting for Python backend to be ready...");
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await fetch('http://localhost:8000/health', { 
        signal: AbortSignal.timeout(2000) // 2 second timeout per check
      });
      if (response.ok) {
        console.log("✅ Python backend is ready!");
        return true;
      }
    } catch (error) {
      // Backend not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  console.warn("⚠️  Python backend not ready after maximum wait time, starting anyway");
  return false;
}

// Start Python backend first
startPythonApp();

// Wait for Python backend to be ready, then setup Vite and start server
(async () => {
  const PORT = 5000; // Use port 5000 for Node proxy (frontend), Python uses 8000
  
  // Wait for Python backend to be ready
  await waitForPythonBackend();
  
  // Setup Vite for React frontend
  await setupViteServer();
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Node.js proxy server running at http://0.0.0.0:${PORT}`);
    console.log(`📱 Proxying API requests to Python Flask backend at http://localhost:8000`);
    console.log(`⚛️  Serving React frontend via Vite dev server`);
    console.log(`🎯 Access the React application at: http://0.0.0.0:${PORT}`);
  });
})();

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit(0);
});