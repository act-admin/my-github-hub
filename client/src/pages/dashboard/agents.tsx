import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { JSX } from "react";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AgentsProps {
  persona: string;
}

export default function Agents({ persona }: AgentsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for agents
  const agentsData = {
    agents: [
      { 
        id: "1", 
        name: "Incident Management", 
        category: "IT Service", 
        description: "Transforms traditional IT issue reporting into a seamless, automated, and conversational experience—helping employees resolve problems faster while reducing the burden on support teams.", 
        status: "active" as const, 
        accuracy: 98.5, 
        usage: 1247, 
        timeSaved: "320 hrs/month",
        tags: ["Ticket Management", "Automation"],
        capabilities: ["ITSM", "Self-Service", "Guided Prompts", "Customer Support"]
      },
      { 
        id: "2", 
        name: "Request Management", 
        category: "IT Service", 
        description: "Enables employees to raise, manage, and track IT-related requests—such as hardware, software, and service needs—directly through an intelligent conversational interface.", 
        status: "active" as const, 
        accuracy: 97.2, 
        usage: 856, 
        timeSaved: "180 hrs/month",
        tags: ["Ticket Management", "Conversational Agent"],
        capabilities: ["ITSM", "Self-service", "Guided Flows", "Customer Support"]
      },
      { 
        id: "3", 
        name: "Access Management", 
        category: "Security", 
        description: "Unlocks the user accounts or resets forgotten passwords for a wide range of enterprise applications. The AI agent intelligently guides users step-by-step, ensuring a smooth and secure experience.", 
        status: "active" as const, 
        accuracy: 99.1, 
        usage: 432, 
        timeSaved: "95 hrs/month",
        tags: ["Self-Service", "Security"],
        capabilities: ["Single Sign On", "ITSM", "2FA", "Customer Support"]
      },
      { 
        id: "4", 
        name: "Invoice Processing", 
        category: "Finance", 
        description: "Automates the entire invoice processing workflow from receipt to payment approval. Extracts data, validates against POs, and routes for approval.", 
        status: "active" as const, 
        accuracy: 96.8, 
        usage: 312, 
        timeSaved: "75 hrs/month",
        tags: ["Finance Automation", "Document Processing"],
        capabilities: ["OCR", "Data Extraction", "Approval Workflow", "ERP Integration"]
      },
      { 
        id: "5", 
        name: "Customer Support Agent", 
        category: "Service", 
        description: "Provides 24/7 intelligent customer support through natural language conversations. Resolves common inquiries and escalates complex issues to human agents.", 
        status: "active" as const, 
        accuracy: 94.5, 
        usage: 678, 
        timeSaved: "210 hrs/month",
        tags: ["Customer Service", "Conversational AI"],
        capabilities: ["Ticket Creation", "FAQ Resolution", "Escalation", "Multi-language"]
      },
      { 
        id: "6", 
        name: "Expense Tracker", 
        category: "Finance", 
        description: "Tracks and categorizes business expenses automatically. Integrates with corporate cards and generates expense reports for reimbursement.", 
        status: "beta" as const, 
        accuracy: 95.3, 
        usage: 234, 
        timeSaved: "45 hrs/month",
        tags: ["Expense Management", "Automation"],
        capabilities: ["Receipt Scanning", "Policy Compliance", "Reporting", "Integrations"]
      },
    ],
    summary: { total: 6, active: 5, totalUsage: 3759, avgAccuracy: 96.9 }
  };
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const filteredAgents = (agentsData as any)?.agents?.filter((agent: any) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="p-8 space-y-8" data-testid="page-agents">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Agents Repository</h1>
        <p className="text-sm text-muted-foreground mt-1">Explore and manage your automation agents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Total Agents</span>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#3B5998]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{(agentsData as any)?.summary?.total || 0}</div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Active Agents</span>
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{(agentsData as any)?.summary?.active || 0}</div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Total Usage</span>
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#E8744E]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{(agentsData as any)?.summary?.totalUsage?.toLocaleString() || 0}</div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Avg Accuracy</span>
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#14B8A6]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{(agentsData as any)?.summary?.avgAccuracy || 0}%</div>
        </Card>
      </div>

      <div>
        <Input
          type="text"
          placeholder="Search agents by name, category, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
          data-testid="input-search-agents"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent: any) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <Card className="p-12 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No agents found</h3>
          <p className="text-muted-foreground">Try adjusting your search query</p>
        </Card>
      )}
    </div>
  );
}