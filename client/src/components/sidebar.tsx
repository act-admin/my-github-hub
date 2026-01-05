import { Agent, ApiConnection } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Database,
  FolderOpen,
  Shield,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import scodacLogo from "@assets/ScodacLogoApproved.png";
import scodacFavicon from "@assets/scodac-favicon.png";
import { useState } from "react";

interface SidebarProps {
  agents: Agent[];
  connections: ApiConnection[];
  isConnected: boolean;
}

const agentIcons = {
  hr: Users,
  data: Database,
  project: FolderOpen,
  security: Shield,
};

const agentColors = {
  hr: "bg-gray-100",
  data: "bg-gray-100",
  project: "bg-gray-100",
  security: "bg-gray-100",
};

const statusColors = {
  idle: "bg-muted",
  active: "bg-green-500",
  working: "bg-primary",
  monitoring: "bg-chart-2",
  error: "bg-destructive",
};

export default function Sidebar({
  agents,
  connections,
  isConnected,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="relative flex">
      <div
        className={`${isOpen ? "w-80" : "w-20"} bg-white border-r border-border flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-center w-full">
            {isOpen ? (
              <img
                src={scodacLogo}
                alt="SCODAC"
                className="h-12 w-auto transition-all duration-300"
              />
            ) : (
              <img
                src={scodacFavicon}
                alt="SCODAC"
                className="h-12 w-12 transition-all duration-300"
              />
            )}
          </div>
        </div>

      {/* WebSocket Connection Status */}
      {isOpen && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Connection Status
            </span>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full status-indicator ${
                  isConnected ? "websocket-connected" : "bg-destructive"
                }`}
              />
              <span
                className="text-sm text-muted-foreground"
                data-testid="text-connection-status"
              >
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Agents Status - Always show, adapt to sidebar state */}
      <div className="flex-1 p-4">
        {isOpen && (
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Agent Status
          </h3>
        )}
        <div className={`${isOpen ? "space-y-3" : "space-y-4"}`}>
          {agents.map((agent) => {
            const IconComponent =
              agentIcons[agent.type as keyof typeof agentIcons] || Bot;
            const colorClass =
              agentColors[agent.type as keyof typeof agentColors] ||
              "bg-muted";
            const statusColor =
              statusColors[agent.status as keyof typeof statusColors] ||
              "bg-muted";

            return (
              <div key={agent.id} className={`${isOpen ? "p-3" : "p-2"} transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <IconComponent className="text-gray-700 h-4 w-4" />
                    </div>
                    {isOpen && (
                      <div className="flex-1">
                        <p
                          className="text-sm font-medium text-foreground"
                          data-testid={`text-agent-name-${agent.type}`}
                        >
                          {agent.name}
                        </p>
                        <p
                          className="text-xs text-muted-foreground"
                          data-testid={`text-agent-status-${agent.type}`}
                        >
                          {agent.status === "working"
                            ? "Processing query"
                            : agent.status === "monitoring"
                              ? "Monitoring"
                              : agent.status === "active"
                                ? "Active"
                                : agent.status === "error"
                                  ? "Error"
                                  : "Idle"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Connections */}
      {isOpen && (
        <div className="p-4 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            API Connections
          </h3>
          <div className="space-y-2">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between text-xs"
              >
                <span
                  className="text-muted-foreground"
                  data-testid={`text-api-name-${connection.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {connection.name}
                </span>
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connection.status === "online"
                        ? "bg-green-500"
                        : "bg-destructive"
                    }`}
                  />
                  <span
                    className={`${
                      connection.status === "online"
                        ? "text-green-500"
                        : "text-destructive"
                    }`}
                    data-testid={`text-api-status-${connection.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {connection.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
      
      {/* Toggle Button positioned on the border */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-6 z-10 p-1 bg-background border border-border rounded-full shadow-sm hover:bg-muted transition-all duration-300"
        data-testid="button-sidebar-toggle"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
