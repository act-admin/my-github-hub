import React, { useEffect, useState } from "react";
import { PowerBIEmbed } from "powerbi-client-react";
import { models } from "powerbi-client";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PowerBIEmbedServerTokenProps {
  reportId: string;
  groupId?: string;
  message: string;
}

export default function PowerBIEmbedServerToken({ 
  reportId, 
  groupId,
  message 
}: PowerBIEmbedServerTokenProps) {
  const [embedConfig, setEmbedConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [dashboardType, setDashboardType] = useState<string>("");

  useEffect(() => {
    // Detect dashboard type based on reportId
    if (reportId === "70a9bb4d-d2b7-47e8-a8e1-0691928061bb") {
      setDashboardType("Financial");
    } else if (reportId === "ffc3a176-212b-4a33-b10a-311b4151d5b1") {
      setDashboardType("Medical");
    }

    const getEmbedToken = async () => {
      try {
        console.log("PowerBI: Fetching embed token from server...");
        
        const response = await fetch("/api/powerbi/embed-token", {
          method: "POST",
          body: JSON.stringify({ reportId, groupId }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch embed token");
        }

        const data = await response.json();
        console.log("PowerBI: Embed token received");

        const config = {
          type: "report" as const,
          id: reportId,
          embedUrl: data.embedUrl,
          accessToken: data.embedToken,
          tokenType: models.TokenType.Embed,
          settings: {
            panes: {
              filters: {
                expanded: false,
                visible: true,
              },
              pageNavigation: {
                visible: true,
              },
            },
            background: models.BackgroundType.Transparent,
          },
        };

        setEmbedConfig(config);
        setIsLoading(false);
      } catch (err) {
        console.error("PowerBI: Error fetching embed token:", err);
        setError("Failed to load dashboard. Please try again.");
        setIsLoading(false);
      }
    };

    getEmbedToken();
  }, [reportId, groupId]);

  const eventHandlers = new Map([
    ["loaded", () => console.log("PowerBI: Report loaded")],
    ["rendered", () => {
      console.log("PowerBI: Report rendered");
      setIsRendered(true);
    }],
    ["error", (event: any) => {
      console.error("PowerBI: Report error:", event.detail);
      setError("Failed to load dashboard. Please try again.");
    }],
  ]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-700 mb-2">{message}</p>
        <div className="w-full flex items-center justify-center" style={{ height: "750px" }}>
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">
              {dashboardType ? `Loading your ${dashboardType} analytics dashboard...` : "Loading dashboard..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-700 mb-2">{message}</p>
        <div className="w-full flex items-center justify-center" style={{ height: "750px" }}>
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!embedConfig) {
    return null;
  }

  const completionMessage = isRendered && dashboardType
    ? `Here is your ${dashboardType} report from PowerBI dashboard`
    : message;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-700 mb-2">{completionMessage}</p>
      <div className="w-full rounded-lg overflow-hidden shadow-md" style={{ height: "750px" }}>
        <PowerBIEmbed
          embedConfig={embedConfig}
          eventHandlers={eventHandlers}
          cssClassName="w-full h-full rounded border border-gray-200 bg-white"
          getEmbeddedComponent={(embeddedReport) => {
            (window as any).report = embeddedReport;
          }}
        />
      </div>
    </div>
  );
}
