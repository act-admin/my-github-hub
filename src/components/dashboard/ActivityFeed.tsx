import React from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";

interface Activity {
  time: string;
  status: 'completed' | 'active' | 'urgent' | 'pending';
  text: string;
  category?: string;
}

interface ActivityFeedProps {
  title: string;
  subtitle?: string;
  activities: Activity[];
}

export function ActivityFeed({ title, subtitle, activities }: ActivityFeedProps) {
  const statusIcons = {
    completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    active: <Circle className="w-5 h-5 text-[#2E5AAC]" />,
    urgent: <AlertCircle className="w-5 h-5 text-[#E8744E]" />,
    pending: <Clock className="w-5 h-5 text-amber-500" />
  };

  const statusColors = {
    completed: 'bg-green-50 border-green-100',
    active: 'bg-blue-50 border-blue-100',
    urgent: 'bg-orange-50 border-orange-100',
    pending: 'bg-amber-50 border-amber-100'
  };

  return (
    <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]" data-testid="widget-activity-feed">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-3 p-3 rounded-lg border ${statusColors[activity.status]}`}
            data-testid={`activity-${index}`}
          >
            <div className="mt-0.5">
              {statusIcons[activity.status]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">{activity.time}</span>
                {activity.category && (
                  <span className="text-xs px-2 py-0.5 bg-white rounded-full text-muted-foreground">
                    {activity.category}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{activity.text}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}