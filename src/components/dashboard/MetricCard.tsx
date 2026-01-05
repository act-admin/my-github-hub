import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  subtitle?: string;
  color?: 'blue' | 'red' | 'green' | 'purple' | 'yellow' | 'cyan' | 'orange';
  icon?: React.ReactNode;
}

const iconBgClasses = {
  blue: 'bg-blue-50 text-[#3B5998]',
  red: 'bg-red-50 text-red-500',
  green: 'bg-green-50 text-[#22C55E]',
  purple: 'bg-purple-50 text-purple-500',
  yellow: 'bg-amber-50 text-amber-500',
  cyan: 'bg-teal-50 text-[#14B8A6]',
  orange: 'bg-orange-50 text-[#E8744E]'
};

export function MetricCard({
  label,
  value,
  change,
  trend,
  subtitle,
  color = 'blue',
  icon
}: MetricCardProps) {
  const isPositive = trend === 'up';
  
  return (
    <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow" data-testid={`card-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBgClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="mb-3">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
      </div>

      {(change || subtitle) && (
        <div className="flex items-center gap-2 text-sm">
          {change && (
            <div className={`flex items-center gap-1 ${isPositive ? 'text-[#22C55E]' : 'text-red-500'}`}>
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="font-medium">{change}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-gray-400">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
}
