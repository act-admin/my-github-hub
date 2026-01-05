import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartWidget } from "@/components/dashboard/ChartWidget";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Zap,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  PieChart,
  Shield,
  LineChart,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface AutomationDashboardProps {
  persona: string;
}

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 72,
  strokeWidth = 8,
  color,
  bgColor = "#f1f5f9",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{
            filter: `drop-shadow(0 0 3px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-sm font-bold tracking-tight" 
          style={{ color }}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export default function AutomationDashboard({
  persona,
}: AutomationDashboardProps) {
  const mockMetrics = {
    metrics: [
      { label: "Total Queries", value: "2,847", change: "+12.5%", trend: "up", subtitle: "Last 30 days" },
      { label: "Automation Rate", value: "94.2%", change: "+3.8%", trend: "up", subtitle: "vs last month" },
      { label: "Avg Response Time", value: "1.2s", change: "-18%", trend: "up", subtitle: "Improvement" },
      { label: "Active Users", value: "156", change: "+8", trend: "up", subtitle: "This week" },
    ]
  };

  const mockAnalytics = {
    charts: [
      { month: "Jan", statistics: 65, transactions: 120, customers: 45 },
      { month: "Feb", statistics: 78, transactions: 145, customers: 52 },
      { month: "Mar", statistics: 82, transactions: 160, customers: 58 },
      { month: "Apr", statistics: 91, transactions: 178, customers: 65 },
      { month: "May", statistics: 88, transactions: 192, customers: 72 },
      { month: "Jun", statistics: 95, transactions: 210, customers: 78 },
    ],
    activities: [
      { id: 1, type: "query", text: "Invoice query processed", message: "Invoice query processed", time: "2 mins ago", status: "completed" as const },
      { id: 2, type: "automation", text: "New agent deployed", message: "New agent deployed", time: "15 mins ago", status: "active" as const },
      { id: 3, type: "report", text: "Monthly report generated", message: "Monthly report generated", time: "1 hour ago", status: "completed" as const },
    ],
    summary: { totalRecords: 2847 }
  };

  const mockAutomationServices = {
    services: [
      { 
        id: 1, 
        name: "Invoice Processing", 
        description: "Automated AP/AR invoice handling", 
        icon: FileText,
        iconBg: "bg-[#EFF6FF]",
        iconColor: "text-[#3B5998]",
        progressColor: "#3B5998",
        progressBg: "#EFF6FF",
        accuracy: 98.5, 
        queriesProcessed: 1247, 
        timeSavedHours: 156, 
        costSaved: 12500, 
        avgResponseTime: 1.2, 
        division: "Invoice Processing", 
        delta: 15,
        totalCount: 1247,
        countLabel: "total invoices",
        subtitle: "AR + AP"
      },
      { 
        id: 2, 
        name: "Financial Reporting", 
        description: "Automated financial statement generation", 
        icon: BarChart3,
        iconBg: "bg-[#FFF7ED]",
        iconColor: "text-[#E8744E]",
        progressColor: "#E8744E",
        progressBg: "#FFF7ED",
        accuracy: 97.2, 
        queriesProcessed: 856, 
        timeSavedHours: 98, 
        costSaved: 8900, 
        avgResponseTime: 1.5, 
        division: "Financial Reporting", 
        delta: 17,
        totalCount: 1168,
        countLabel: "journal entries",
        subtitle: "General"
      },
      { 
        id: 3, 
        name: "Compliance Check", 
        description: "Regulatory compliance automation", 
        icon: Shield,
        iconBg: "bg-green-50",
        iconColor: "text-[#22C55E]",
        progressColor: "#22C55E",
        progressBg: "#DCFCE7",
        accuracy: 99.1, 
        queriesProcessed: 432, 
        timeSavedHours: 67, 
        costSaved: 5600, 
        avgResponseTime: 0.9, 
        division: "Compliance Review", 
        delta: 8,
        totalCount: 432,
        countLabel: "checks completed",
        subtitle: "Quality"
      },
      { 
        id: 4, 
        name: "Data Analytics", 
        description: "Real-time business analytics", 
        icon: LineChart,
        iconBg: "bg-teal-50",
        iconColor: "text-[#14B8A6]",
        progressColor: "#14B8A6",
        progressBg: "#CCFBF1",
        accuracy: 96.8, 
        queriesProcessed: 312, 
        timeSavedHours: 45, 
        costSaved: 3800, 
        avgResponseTime: 1.8, 
        division: "Data Analytics", 
        delta: 12,
        totalCount: 312,
        countLabel: "reports generated",
        subtitle: "Insights"
      },
    ],
    totals: { totalTimeSavedHours: 366, totalCostSaved: 30800 }
  };

  const services = mockAutomationServices.services;
  const serviceTotals = mockAutomationServices.totals;
  const metrics = mockMetrics;
  const analytics = mockAnalytics;

  const cardColors = ["blue", "orange", "green", "cyan"] as const;
  const cardIconComponents = [BarChart3, TrendingUp, Clock, Users];

  const growthStats = [
    {
      title: "Invoice Processing",
      delta: 15,
      subtitle: "AR + AP",
      count: 1247,
      countLabel: "total invoices",
      color: "#3B5998",
      progress: 75,
    },
    {
      title: "Financial Reporting",
      delta: 17,
      subtitle: "General",
      count: 1168,
      countLabel: "journal entries",
      color: "#E8744E",
      progress: 82,
    },
    {
      title: "Compliance Review",
      delta: 8,
      subtitle: "Quality",
      count: 432,
      countLabel: "checks completed",
      color: "#22C55E",
      progress: 60,
    },
  ];

  return (
    <div className="p-8 space-y-8" data-testid="page-automation-dashboard">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Automation Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your automation performance and key metrics
          </p>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">
              Total Time Saved
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {serviceTotals.totalTimeSavedHours}h
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">
              Total Cost Saved
            </div>
            <div className="text-3xl font-bold text-[#22C55E]">
              ${serviceTotals.totalCostSaved.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {services.map((service, index) => {
          const IconComponent = service.icon;
          return (
            <div
              key={service.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
              data-testid={`service-card-${service.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${service.iconBg} flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 ${service.iconColor}`} />
                </div>
                <CircularProgress 
                  percentage={service.accuracy} 
                  color={service.progressColor}
                  bgColor={service.progressBg}
                  size={72}
                  strokeWidth={8}
                />
              </div>

              <h3
                className="text-[15px] font-semibold text-gray-900 mb-1"
                data-testid={`text-service-name-${index}`}
              >
                {service.name}
              </h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                {service.description}
              </p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <div className="text-[11px] text-gray-400 mb-0.5">Queries Processed</div>
                  <div className="text-base font-bold text-gray-900" data-testid={`text-queries-${index}`}>
                    {service.queriesProcessed.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-0.5">Time Saved</div>
                  <div className="text-base font-bold text-gray-900" data-testid={`text-timesaved-${index}`}>
                    {service.timeSavedHours}h
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-0.5">Cost Saved</div>
                  <div className="text-base font-bold" style={{ color: service.progressColor }} data-testid={`text-costsaved-${index}`}>
                    ${service.costSaved.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-0.5">Avg Response</div>
                  <div className="text-base font-bold text-gray-900">
                    {service.avgResponseTime}s
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {growthStats.map((stat, index) => (
          <div
            key={stat.title}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <div className="text-sm font-medium text-gray-900 italic mb-4">
              {stat.title}
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold" style={{ color: stat.color }}>
                +{stat.delta}%
              </span>
              <span className="text-sm text-gray-400">
                {stat.subtitle}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-xl font-bold" style={{ color: stat.color }}>
                {stat.count.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">
                {stat.countLabel}
              </span>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${stat.progress}%`, backgroundColor: stat.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics?.metrics?.map((metric: any, index: number) => {
          const IconComponent = cardIconComponents[index % cardIconComponents.length];
          return (
            <MetricCard
              key={index}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
              subtitle={metric.subtitle}
              color={cardColors[index % cardColors.length]}
              icon={<IconComponent className="w-6 h-6" />}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title="Monthly Performance"
          subtitle="Performance trends over the last 6 months"
          data={analytics?.charts || []}
          dataKey="statistics"
          xAxisKey="month"
          type="bar"
          color="#3b82f6"
        />

        <ChartWidget
          title="Automation Growth"
          subtitle="Growth in automation usage"
          data={analytics?.charts || []}
          dataKey="transactions"
          xAxisKey="month"
          type="line"
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed
          title="Recent Activities"
          subtitle={
            analytics?.summary
              ? `${analytics.summary.totalRecords} total records`
              : undefined
          }
          activities={analytics?.activities || []}
        />

        <ChartWidget
          title="User Engagement"
          subtitle="Active users and engagement metrics"
          data={analytics?.charts || []}
          dataKey="customers"
          xAxisKey="month"
          type="bar"
          color="#10b981"
        />
      </div>
    </div>
  );
}
