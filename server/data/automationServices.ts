// Automation service configurations for all personas
export type AutomationServiceId = 
  // Finance services
  | 'AR' | 'AP' | 'GL' | 'QE'
  // Customer Service services
  | 'TICKET_ROUTING' | 'FAQ_AUTO' | 'SENTIMENT' | 'CALL_SUMMARY'
  // IT services
  | 'INCIDENT_MGMT' | 'ACCESS_PROV' | 'ASSET_TRACK' | 'MONITOR_ALERT'
  // HR services
  | 'ONBOARDING' | 'LEAVE_MGMT' | 'BENEFITS' | 'PERFORMANCE'
  // Sales services
  | 'LEAD_QUAL' | 'OPP_TRACK' | 'QUOTE_GEN' | 'PIPELINE'
  | 'General';

export interface AutomationServiceConfig {
  id: AutomationServiceId;
  name: string;
  fullName: string;
  description: string;
  icon: string;
  avgTimePerQuery: number; // minutes saved per query
  avgCostPerQuery: number; // dollars saved per query
  division?: string;
  keywords?: string[]; // Keywords to identify this service from queries
}

export interface AutomationServiceDummyData {
  id: AutomationServiceId;
  name: string;
  fullName: string;
  description: string;
  icon: string;
  avgTimePerQuery: number;
  avgCostPerQuery: number;
  division: string;
  queriesProcessed: number;
  timeSavedMinutes: number;
  timeSavedHours: number;
  costSaved: number;
  avgResponseTime: string;
  accuracy: number;
  trend: 'up' | 'down' | 'stable';
  delta: number;
  weeklyTrend: number[];
}

export interface PersonaAutomationConfig {
  services: AutomationServiceConfig[];
  defaults?: AutomationServiceDummyData[]; // Dummy data when no queries exist
}

// Persona-based automation service configurations
export const personaAutomationServices: Record<string, PersonaAutomationConfig> = {
  'finance-accounting': {
    services: [
      {
        id: 'AR',
        name: 'AR Automation',
        fullName: 'Accounts Receivable Automation',
        description: 'Automated customer invoice processing and payment tracking',
        icon: '💰',
        avgTimePerQuery: 15,
        avgCostPerQuery: 12,
        division: 'Invoice Processing',
        keywords: ['accounts receivable', 'customer invoice', 'payment tracking', 'AR']
      },
      {
        id: 'AP',
        name: 'AP Automation',
        fullName: 'Accounts Payable Automation',
        description: 'Automated vendor invoice processing and approval workflows',
        icon: '💳',
        avgTimePerQuery: 18,
        avgCostPerQuery: 15,
        division: 'Invoice Processing',
        keywords: ['accounts payable', 'vendor invoice', 'approval', 'AP']
      },
      {
        id: 'GL',
        name: 'General Ledger Automation',
        fullName: 'General Ledger Automation',
        description: 'Automated journal entries and financial reporting',
        icon: '📊',
        avgTimePerQuery: 25,
        avgCostPerQuery: 20,
        division: 'Financial Reporting',
        keywords: ['general ledger', 'journal entry', 'financial report', 'GL']
      },
      {
        id: 'QE',
        name: 'Quality Enclosure',
        fullName: 'Quality & Compliance Automation',
        description: 'Automated quality checks and compliance reviews',
        icon: '✅',
        avgTimePerQuery: 20,
        avgCostPerQuery: 18,
        division: 'Compliance Review',
        keywords: ['quality', 'compliance', 'audit', 'review']
      }
    ],
    defaults: [
      {
        id: 'AR',
        name: 'AR Automation',
        fullName: 'Accounts Receivable Automation',
        description: 'Automated customer invoice processing and payment tracking',
        icon: '💰',
        avgTimePerQuery: 15,
        avgCostPerQuery: 12,
        queriesProcessed: 145,
        timeSavedMinutes: 2175,
        timeSavedHours: 36.3,
        costSaved: 1740,
        avgResponseTime: '1.10',
        accuracy: 98.3,
        division: 'Invoice Processing',
        trend: 'up',
        delta: 12,
        weeklyTrend: [98, 112, 125, 145]
      },
      {
        id: 'AP',
        name: 'AP Automation',
        fullName: 'Accounts Payable Automation',
        description: 'Automated vendor invoice processing and approval workflows',
        icon: '💳',
        avgTimePerQuery: 18,
        avgCostPerQuery: 15,
        queriesProcessed: 132,
        timeSavedMinutes: 2376,
        timeSavedHours: 39.6,
        costSaved: 1980,
        avgResponseTime: '1.46',
        accuracy: 96.0,
        division: 'Invoice Processing',
        trend: 'up',
        delta: 18,
        weeklyTrend: [89, 105, 118, 132]
      },
      {
        id: 'GL',
        name: 'General Ledger Automation',
        fullName: 'General Ledger Automation',
        description: 'Automated journal entries and financial reporting',
        icon: '📊',
        avgTimePerQuery: 25,
        avgCostPerQuery: 20,
        queriesProcessed: 87,
        timeSavedMinutes: 2175,
        timeSavedHours: 36.3,
        costSaved: 1740,
        avgResponseTime: '1.82',
        accuracy: 97.1,
        division: 'Financial Reporting',
        trend: 'up',
        delta: 25,
        weeklyTrend: [52, 65, 74, 87]
      },
      {
        id: 'QE',
        name: 'Quality Enclosure',
        fullName: 'Quality & Compliance Automation',
        description: 'Automated quality checks and compliance reviews',
        icon: '✅',
        avgTimePerQuery: 20,
        avgCostPerQuery: 18,
        queriesProcessed: 64,
        timeSavedMinutes: 1280,
        timeSavedHours: 21.3,
        costSaved: 1152,
        avgResponseTime: '1.65',
        accuracy: 99.2,
        division: 'Compliance Review',
        trend: 'down',
        delta: -15,
        weeklyTrend: [85, 78, 71, 64]
      }
    ]
  },
  'customer-service': {
    services: [
      {
        id: 'TICKET_ROUTING',
        name: 'Ticket Routing',
        fullName: 'Intelligent Ticket Routing',
        description: 'Automated ticket categorization and priority-based routing',
        icon: '🎫',
        avgTimePerQuery: 12,
        avgCostPerQuery: 10,
        division: 'Support Automation',
        keywords: ['ticket', 'routing', 'categorization', 'priority']
      },
      {
        id: 'FAQ_AUTO',
        name: 'FAQ Automation',
        fullName: 'Self-Service FAQ Automation',
        description: 'Automated responses to frequently asked customer questions',
        icon: '❓',
        avgTimePerQuery: 8,
        avgCostPerQuery: 6,
        division: 'Support Automation',
        keywords: ['faq', 'self-service', 'knowledge base', 'help']
      },
      {
        id: 'SENTIMENT',
        name: 'Sentiment Analysis',
        fullName: 'Customer Sentiment Analysis',
        description: 'Real-time sentiment detection and escalation for negative feedback',
        icon: '😊',
        avgTimePerQuery: 10,
        avgCostPerQuery: 8,
        division: 'Customer Intelligence',
        keywords: ['sentiment', 'feedback', 'emotion', 'satisfaction']
      },
      {
        id: 'CALL_SUMMARY',
        name: 'Call Summarization',
        fullName: 'AI-Powered Call Summarization',
        description: 'Automated transcription and summarization of customer calls',
        icon: '📞',
        avgTimePerQuery: 15,
        avgCostPerQuery: 12,
        division: 'Customer Intelligence',
        keywords: ['call', 'transcription', 'summary', 'recording']
      }
    ],
    defaults: [
      {
        id: 'TICKET_ROUTING',
        name: 'Ticket Routing',
        fullName: 'Intelligent Ticket Routing',
        description: 'Automated ticket categorization and priority-based routing',
        icon: '🎫',
        avgTimePerQuery: 12,
        avgCostPerQuery: 10,
        queriesProcessed: 234,
        timeSavedMinutes: 2808,
        timeSavedHours: 46.8,
        costSaved: 2340,
        avgResponseTime: '0.95',
        accuracy: 96.8,
        division: 'Support Automation',
        trend: 'up',
        delta: 22,
        weeklyTrend: [178, 195, 218, 234]
      },
      {
        id: 'FAQ_AUTO',
        name: 'FAQ Automation',
        fullName: 'Self-Service FAQ Automation',
        description: 'Automated responses to frequently asked customer questions',
        icon: '❓',
        avgTimePerQuery: 8,
        avgCostPerQuery: 6,
        queriesProcessed: 312,
        timeSavedMinutes: 2496,
        timeSavedHours: 41.6,
        costSaved: 1872,
        avgResponseTime: '0.62',
        accuracy: 98.5,
        division: 'Support Automation',
        trend: 'up',
        delta: 28,
        weeklyTrend: [215, 248, 285, 312]
      },
      {
        id: 'SENTIMENT',
        name: 'Sentiment Analysis',
        fullName: 'Customer Sentiment Analysis',
        description: 'Real-time sentiment detection and escalation for negative feedback',
        icon: '😊',
        avgTimePerQuery: 10,
        avgCostPerQuery: 8,
        queriesProcessed: 187,
        timeSavedMinutes: 1870,
        timeSavedHours: 31.2,
        costSaved: 1496,
        avgResponseTime: '0.88',
        accuracy: 94.2,
        division: 'Customer Intelligence',
        trend: 'up',
        delta: 15,
        weeklyTrend: [145, 162, 175, 187]
      },
      {
        id: 'CALL_SUMMARY',
        name: 'Call Summarization',
        fullName: 'AI-Powered Call Summarization',
        description: 'Automated transcription and summarization of customer calls',
        icon: '📞',
        avgTimePerQuery: 15,
        avgCostPerQuery: 12,
        queriesProcessed: 156,
        timeSavedMinutes: 2340,
        timeSavedHours: 39.0,
        costSaved: 1872,
        avgResponseTime: '1.45',
        accuracy: 97.3,
        division: 'Customer Intelligence',
        trend: 'up',
        delta: 18,
        weeklyTrend: [118, 132, 145, 156]
      }
    ]
  },
  'it': {
    services: [
      {
        id: 'INCIDENT_MGMT',
        name: 'Incident Management',
        fullName: 'Automated Incident Management',
        description: 'AI-powered incident detection, triage, and resolution workflows',
        icon: '🚨',
        avgTimePerQuery: 30,
        avgCostPerQuery: 25,
        division: 'Operations',
        keywords: ['incident', 'outage', 'emergency', 'down']
      },
      {
        id: 'ACCESS_PROV',
        name: 'Access Provisioning',
        fullName: 'User Access Provisioning',
        description: 'Automated account creation and access rights management',
        icon: '🔐',
        avgTimePerQuery: 20,
        avgCostPerQuery: 15,
        division: 'Operations',
        keywords: ['access', 'provisioning', 'permissions', 'account']
      },
      {
        id: 'ASSET_TRACK',
        name: 'Asset Tracking',
        fullName: 'IT Asset Tracking',
        description: 'Automated hardware and software inventory management',
        icon: '💻',
        avgTimePerQuery: 10,
        avgCostPerQuery: 8,
        division: 'Infrastructure',
        keywords: ['asset', 'inventory', 'hardware', 'software']
      },
      {
        id: 'MONITOR_ALERT',
        name: 'Monitoring & Alerts',
        fullName: 'System Monitoring & Alerts',
        description: 'Intelligent system monitoring with automated alert management',
        icon: '📊',
        avgTimePerQuery: 15,
        avgCostPerQuery: 12,
        division: 'Infrastructure',
        keywords: ['monitoring', 'alert', 'performance', 'uptime']
      }
    ],
    defaults: [
      {
        id: 'INCIDENT_MGMT',
        name: 'Incident Management',
        fullName: 'Automated Incident Management',
        description: 'AI-powered incident detection, triage, and resolution workflows',
        icon: '🚨',
        avgTimePerQuery: 30,
        avgCostPerQuery: 25,
        queriesProcessed: 78,
        timeSavedMinutes: 2340,
        timeSavedHours: 39.0,
        costSaved: 1950,
        avgResponseTime: '2.15',
        accuracy: 95.4,
        division: 'Operations',
        trend: 'down',
        delta: -8,
        weeklyTrend: [92, 87, 82, 78]
      },
      {
        id: 'ACCESS_PROV',
        name: 'Access Provisioning',
        fullName: 'User Access Provisioning',
        description: 'Automated account creation and access rights management',
        icon: '🔐',
        avgTimePerQuery: 20,
        avgCostPerQuery: 15,
        queriesProcessed: 143,
        timeSavedMinutes: 2860,
        timeSavedHours: 47.7,
        costSaved: 2145,
        avgResponseTime: '1.32',
        accuracy: 98.1,
        division: 'Operations',
        trend: 'up',
        delta: 24,
        weeklyTrend: [102, 118, 132, 143]
      },
      {
        id: 'ASSET_TRACK',
        name: 'Asset Tracking',
        fullName: 'IT Asset Tracking',
        description: 'Automated hardware and software inventory management',
        icon: '💻',
        avgTimePerQuery: 10,
        avgCostPerQuery: 8,
        queriesProcessed: 96,
        timeSavedMinutes: 960,
        timeSavedHours: 16.0,
        costSaved: 768,
        avgResponseTime: '0.78',
        accuracy: 99.1,
        division: 'Infrastructure',
        trend: 'up',
        delta: 12,
        weeklyTrend: [78, 84, 91, 96]
      },
      {
        id: 'MONITOR_ALERT',
        name: 'Monitoring & Alerts',
        fullName: 'System Monitoring & Alerts',
        description: 'Intelligent system monitoring with automated alert management',
        icon: '📊',
        avgTimePerQuery: 15,
        avgCostPerQuery: 12,
        queriesProcessed: 211,
        timeSavedMinutes: 3165,
        timeSavedHours: 52.8,
        costSaved: 2532,
        avgResponseTime: '1.05',
        accuracy: 97.6,
        division: 'Infrastructure',
        trend: 'up',
        delta: 19,
        weeklyTrend: [162, 178, 195, 211]
      }
    ]
  },
  'human-resources': {
    services: [
      {
        id: 'ONBOARDING',
        name: 'Onboarding Automation',
        fullName: 'Employee Onboarding Automation',
        description: 'Streamlined new hire onboarding and documentation workflows',
        icon: '👋',
        avgTimePerQuery: 35,
        avgCostPerQuery: 28,
        division: 'Talent Management',
        keywords: ['onboarding', 'new hire', 'orientation', 'welcome']
      },
      {
        id: 'LEAVE_MGMT',
        name: 'Leave Management',
        fullName: 'Automated Leave Management',
        description: 'AI-powered leave request processing and balance tracking',
        icon: '🏖️',
        avgTimePerQuery: 10,
        avgCostPerQuery: 8,
        division: 'Talent Management',
        keywords: ['leave', 'vacation', 'time off', 'pto']
      },
      {
        id: 'BENEFITS',
        name: 'Benefits Assistant',
        fullName: 'Employee Benefits Assistant',
        description: 'Automated benefits enrollment and query resolution',
        icon: '💼',
        avgTimePerQuery: 20,
        avgCostPerQuery: 15,
        division: 'Employee Services',
        keywords: ['benefits', 'insurance', 'enrollment', '401k']
      },
      {
        id: 'PERFORMANCE',
        name: 'Performance Tracking',
        fullName: 'Performance Management',
        description: 'Automated performance review scheduling and tracking',
        icon: '📈',
        avgTimePerQuery: 25,
        avgCostPerQuery: 20,
        division: 'Employee Services',
        keywords: ['performance', 'review', 'evaluation', 'feedback']
      }
    ],
    defaults: [
      {
        id: 'ONBOARDING',
        name: 'Onboarding Automation',
        fullName: 'Employee Onboarding Automation',
        description: 'Streamlined new hire onboarding and documentation workflows',
        icon: '👋',
        avgTimePerQuery: 35,
        avgCostPerQuery: 28,
        queriesProcessed: 54,
        timeSavedMinutes: 1890,
        timeSavedHours: 31.5,
        costSaved: 1512,
        avgResponseTime: '2.48',
        accuracy: 96.7,
        division: 'Talent Management',
        trend: 'up',
        delta: 8,
        weeklyTrend: [42, 47, 51, 54]
      },
      {
        id: 'LEAVE_MGMT',
        name: 'Leave Management',
        fullName: 'Automated Leave Management',
        description: 'AI-powered leave request processing and balance tracking',
        icon: '🏖️',
        avgTimePerQuery: 10,
        avgCostPerQuery: 8,
        queriesProcessed: 189,
        timeSavedMinutes: 1890,
        timeSavedHours: 31.5,
        costSaved: 1512,
        avgResponseTime: '0.85',
        accuracy: 99.3,
        division: 'Talent Management',
        trend: 'up',
        delta: 16,
        weeklyTrend: [152, 168, 179, 189]
      },
      {
        id: 'BENEFITS',
        name: 'Benefits Assistant',
        fullName: 'Employee Benefits Assistant',
        description: 'Automated benefits enrollment and query resolution',
        icon: '💼',
        avgTimePerQuery: 20,
        avgCostPerQuery: 15,
        queriesProcessed: 127,
        timeSavedMinutes: 2540,
        timeSavedHours: 42.3,
        costSaved: 1905,
        avgResponseTime: '1.62',
        accuracy: 97.8,
        division: 'Employee Services',
        trend: 'up',
        delta: 21,
        weeklyTrend: [92, 105, 118, 127]
      },
      {
        id: 'PERFORMANCE',
        name: 'Performance Tracking',
        fullName: 'Performance Management',
        description: 'Automated performance review scheduling and tracking',
        icon: '📈',
        avgTimePerQuery: 25,
        avgCostPerQuery: 20,
        queriesProcessed: 73,
        timeSavedMinutes: 1825,
        timeSavedHours: 30.4,
        costSaved: 1460,
        avgResponseTime: '1.98',
        accuracy: 95.2,
        division: 'Employee Services',
        trend: 'down',
        delta: -12,
        weeklyTrend: [89, 84, 78, 73]
      }
    ]
  },
  'sales': {
    services: [
      {
        id: 'LEAD_QUAL',
        name: 'Lead Qualification',
        fullName: 'AI-Powered Lead Qualification',
        description: 'Automated lead scoring and qualification workflows',
        icon: '🎯',
        avgTimePerQuery: 15,
        avgCostPerQuery: 12,
        division: 'Lead Management',
        keywords: ['lead', 'qualification', 'scoring', 'prospect']
      },
      {
        id: 'OPP_TRACK',
        name: 'Opportunity Tracking',
        fullName: 'Opportunity Pipeline Tracking',
        description: 'Automated opportunity updates and CRM synchronization',
        icon: '💼',
        avgTimePerQuery: 20,
        avgCostPerQuery: 15,
        division: 'Lead Management',
        keywords: ['opportunity', 'pipeline', 'deal', 'crm']
      },
      {
        id: 'QUOTE_GEN',
        name: 'Quote Generation',
        fullName: 'Automated Quote Generation',
        description: 'AI-powered proposal and quote generation workflows',
        icon: '📄',
        avgTimePerQuery: 30,
        avgCostPerQuery: 25,
        division: 'Sales Operations',
        keywords: ['quote', 'proposal', 'pricing', 'estimate']
      },
      {
        id: 'PIPELINE',
        name: 'Pipeline Forecasting',
        fullName: 'Sales Pipeline Forecasting',
        description: 'Predictive analytics for sales forecasting and planning',
        icon: '📊',
        avgTimePerQuery: 25,
        avgCostPerQuery: 20,
        division: 'Sales Operations',
        keywords: ['forecast', 'pipeline', 'prediction', 'analytics']
      }
    ],
    defaults: [
      {
        id: 'LEAD_QUAL',
        name: 'Lead Qualification',
        fullName: 'AI-Powered Lead Qualification',
        description: 'Automated lead scoring and qualification workflows',
        icon: '🎯',
        avgTimePerQuery: 15,
        avgCostPerQuery: 12,
        queriesProcessed: 203,
        timeSavedMinutes: 3045,
        timeSavedHours: 50.8,
        costSaved: 2436,
        avgResponseTime: '1.28',
        accuracy: 96.4,
        division: 'Lead Management',
        trend: 'up',
        delta: 26,
        weeklyTrend: [142, 168, 189, 203]
      },
      {
        id: 'OPP_TRACK',
        name: 'Opportunity Tracking',
        fullName: 'Opportunity Pipeline Tracking',
        description: 'Automated opportunity updates and CRM synchronization',
        icon: '💼',
        avgTimePerQuery: 20,
        avgCostPerQuery: 15,
        queriesProcessed: 176,
        timeSavedMinutes: 3520,
        timeSavedHours: 58.7,
        costSaved: 2640,
        avgResponseTime: '1.52',
        accuracy: 97.9,
        division: 'Lead Management',
        trend: 'up',
        delta: 19,
        weeklyTrend: [132, 148, 164, 176]
      },
      {
        id: 'QUOTE_GEN',
        name: 'Quote Generation',
        fullName: 'Automated Quote Generation',
        description: 'AI-powered proposal and quote generation workflows',
        icon: '📄',
        avgTimePerQuery: 30,
        avgCostPerQuery: 25,
        queriesProcessed: 94,
        timeSavedMinutes: 2820,
        timeSavedHours: 47.0,
        costSaved: 2350,
        avgResponseTime: '2.35',
        accuracy: 95.8,
        division: 'Sales Operations',
        trend: 'up',
        delta: 14,
        weeklyTrend: [72, 81, 88, 94]
      },
      {
        id: 'PIPELINE',
        name: 'Pipeline Forecasting',
        fullName: 'Sales Pipeline Forecasting',
        description: 'Predictive analytics for sales forecasting and planning',
        icon: '📊',
        avgTimePerQuery: 25,
        avgCostPerQuery: 20,
        queriesProcessed: 68,
        timeSavedMinutes: 1700,
        timeSavedHours: 28.3,
        costSaved: 1360,
        avgResponseTime: '1.88',
        accuracy: 94.6,
        division: 'Sales Operations',
        trend: 'down',
        delta: -9,
        weeklyTrend: [81, 76, 72, 68]
      }
    ]
  }
};

// Helper function to get automation service ID based on query and persona
export function getAutomationServiceForQuery(
  query: string,
  persona: string
): AutomationServiceId {
  const lowerQuery = query.toLowerCase();
  const personaConfig = personaAutomationServices[persona];
  
  if (!personaConfig) {
    return 'General';
  }
  
  // Check each service's keywords
  for (const service of personaConfig.services) {
    if (service.keywords) {
      for (const keyword of service.keywords) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          return service.id;
        }
      }
    }
  }
  
  return 'General';
}
