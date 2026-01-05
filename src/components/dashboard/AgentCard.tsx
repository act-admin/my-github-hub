import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Cloud, 
  MessageSquare, 
  Settings, 
  Shield, 
  Zap, 
  Database,
  Bot,
  FileText,
  Users,
  Lock,
  Headphones,
  BarChart3
} from "lucide-react";

interface AIModel {
  id: string;
  name: string;
  provider: 'AWS' | 'Azure' | 'NVIDIA' | 'Anthropic' | 'GCP' | 'OpenAI';
  type: 'document' | 'video' | 'voice' | 'image' | 'nlp' | 'data';
  accuracy: number;
  latency: string;
}

interface Agent {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'active' | 'beta' | 'inactive';
  usage: number;
  accuracy: number;
  timeSaved: string;
  models?: AIModel[];
  tags?: string[];
  capabilities?: string[];
}

interface AgentCardProps {
  agent: Agent;
}

const iconSets = [
  [
    { icon: Cloud, color: "text-[#3B5998]" },
    { icon: MessageSquare, color: "text-[#22C55E]" },
    { icon: Settings, color: "text-[#E8744E]" },
  ],
  [
    { icon: Bot, color: "text-[#E8744E]" },
    { icon: FileText, color: "text-[#3B5998]" },
    { icon: Users, color: "text-[#22C55E]" },
  ],
  [
    { icon: Shield, color: "text-[#14B8A6]" },
    { icon: Lock, color: "text-[#E8744E]" },
    { icon: Zap, color: "text-[#3B5998]" },
  ],
  [
    { icon: Headphones, color: "text-[#3B5998]" },
    { icon: Database, color: "text-[#22C55E]" },
    { icon: BarChart3, color: "text-[#E8744E]" },
  ],
];

const tagColors = [
  { bg: "bg-orange-50", text: "text-[#E8744E]", border: "border-orange-200" },
  { bg: "bg-blue-50", text: "text-[#3B5998]", border: "border-blue-200" },
  { bg: "bg-green-50", text: "text-[#22C55E]", border: "border-green-200" },
  { bg: "bg-teal-50", text: "text-[#14B8A6]", border: "border-teal-200" },
];

export function AgentCard({ agent }: AgentCardProps) {
  const agentIndex = parseInt(agent.id.replace(/\D/g, '')) || 0;
  const icons = iconSets[agentIndex % iconSets.length];
  
  const defaultTags = agent.tags || ["Automation", "Self-Service"];
  const defaultCapabilities = agent.capabilities || ["ITSM", "Self-Service", "Guided Prompts", "Customer Support"];
  
  const displayedCapabilities = defaultCapabilities.slice(0, 3);
  const remainingCount = defaultCapabilities.length - 3;

  return (
    <Card 
      className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow" 
      data-testid={`card-agent-${agent.id}`}
    >
      <div className="flex items-center gap-2 mb-5">
        {icons.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div 
              key={idx} 
              className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"
            >
              <IconComponent className={`w-4 h-4 ${item.color}`} />
            </div>
          );
        })}
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-3">
        {agent.name}
      </h3>
      
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        {agent.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {defaultTags.map((tag, idx) => {
          const colorConfig = tagColors[idx % tagColors.length];
          return (
            <span 
              key={tag}
              className={`px-3 py-1.5 text-xs font-medium rounded-full ${colorConfig.bg} ${colorConfig.text}`}
            >
              {tag}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {displayedCapabilities.map((capability) => (
          <span 
            key={capability}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full"
          >
            {capability}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full">
            +{remainingCount}
          </span>
        )}
      </div>
    </Card>
  );
}
