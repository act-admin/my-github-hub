import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface ChartWidgetProps {
  title: string;
  subtitle?: string;
  data: any[];
  dataKey: string;
  xAxisKey?: string;
  type?: "bar" | "line";
  color?: string;
  showFilters?: boolean;
}

export function ChartWidget({
  title,
  subtitle,
  data,
  dataKey,
  xAxisKey = "month",
  type = "bar",
  color = "#3b82f6",
  showFilters = true,
}: ChartWidgetProps) {
  return (
    <Card
      className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      data-testid={`widget-chart-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {showFilters && (
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              data-testid="button-filter-year"
            >
              Year
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid="button-filter-month"
            >
              Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid="button-filter-week"
            >
              Week
            </Button>
          </div>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={xAxisKey}
                tick={{ fill: "#9ea3ad", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "#9ea3ad", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey={dataKey}
                fill={color}
                radius={[8, 8, 0, 0]}
                barSize={16}
              />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={xAxisKey}
                tick={{ fill: "#9ea3ad", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "#9ea3ad", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
