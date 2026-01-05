import React from "react";
import { Card } from "@/components/ui/card";
import { ThumbsUp, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Feedback {
  id: string;
  author: string;
  avatar: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
  status: 'approved' | 'in-review' | 'planned' | 'rejected';
}

interface FeedbackCardProps {
  feedback: Feedback;
}

const statusColors = {
  approved: 'bg-green-100 text-green-700 border-green-200',
  'in-review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  planned: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected: 'bg-red-100 text-red-700 border-red-200'
};

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <Card className="p-6" data-testid={`card-feedback-${feedback.id}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {feedback.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{feedback.author}</h4>
            <span className="text-sm text-muted-foreground">{feedback.time}</span>
            <Badge className={`ml-auto ${statusColors[feedback.status]}`} variant="outline">
              {feedback.status.replace('-', ' ')}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{feedback.content}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-foreground transition-colors" data-testid={`button-like-${feedback.id}`}>
              <ThumbsUp className="w-4 h-4" />
              <span>{feedback.likes}</span>
            </button>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors" data-testid={`button-comment-${feedback.id}`}>
              <MessageCircle className="w-4 h-4" />
              <span>{feedback.comments}</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}