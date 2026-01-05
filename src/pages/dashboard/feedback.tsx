import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { JSX } from "react";
import { FeedbackCard } from "@/components/dashboard/FeedbackCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackProps {
  persona: string;
}

export default function Feedback({ persona }: FeedbackProps) {
  const [feedbackText, setFeedbackText] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const { toast } = useToast();

  // Mock data for feedback
  const feedbackData = {
    stats: { total: 24, approved: 18, pending: 6 },
    feedback: [
      { id: 1, title: "Add batch invoice processing", description: "Would be helpful to process multiple invoices at once", status: "approved", date: "2025-01-04", author: "Sarah W." },
      { id: 2, title: "Improve report formatting", description: "Reports need better PDF export options", status: "pending", date: "2025-01-03", author: "Michael C." },
      { id: 3, title: "Add custom dashboard widgets", description: "Allow users to customize their dashboard layout", status: "approved", date: "2025-01-02", author: "Emma J." },
    ]
  };
  const isLoading = false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback! We'll review it shortly.",
    });
    setFeedbackText("");
    setRequestTitle("");
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-64" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8" data-testid="page-feedback">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Feedback & Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Share your feedback or request new automation features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#3B5998]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-[#E8744E]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Total Feedback</h3>
          <p className="text-sm text-gray-500 mb-4">All feedback submissions received from users</p>
          <div className="text-3xl font-bold text-gray-900 mb-4">{(feedbackData as any)?.stats?.total || 0}</div>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-[#3B5998]">User Feedback</span>
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-orange-50 text-[#E8744E]">Requests</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">All Types</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">Any Status</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full">+2</span>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 text-[#3B5998]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Send className="w-4 h-4 text-[#14B8A6]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Approved</h3>
          <p className="text-sm text-gray-500 mb-4">Feedback items that have been reviewed and approved</p>
          <div className="text-3xl font-bold text-gray-900 mb-4">{(feedbackData as any)?.stats?.approved || 0}</div>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-50 text-[#22C55E]">Approved</span>
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-[#3B5998]">Implemented</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">Ready</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">Completed</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full">+1</span>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#E8744E]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-[#3B5998]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#22C55E]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">In Review</h3>
          <p className="text-sm text-gray-500 mb-4">Feedback items currently being evaluated by the team</p>
          <div className="text-3xl font-bold text-gray-900 mb-4">{(feedbackData as any)?.stats?.pending || 0}</div>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-orange-50 text-[#E8744E]">Pending</span>
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-teal-50 text-[#14B8A6]">Under Review</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">Evaluation</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">Analysis</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full">+2</span>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="text-xl font-semibold text-foreground mb-4">Submit New Feedback or Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="request-title">Title</Label>
            <Input
              id="request-title"
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              placeholder="Brief title for your feedback or request"
              className="mt-1"
              data-testid="input-request-title"
            />
          </div>

          <div>
            <Label htmlFor="feedback-text">Description</Label>
            <textarea
              id="feedback-text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe your feedback or automation request in detail..."
              className="w-full mt-1 p-3 border border-input rounded-md min-h-[150px] bg-background text-foreground"
              data-testid="input-feedback-text"
            />
          </div>

          <Button type="submit" className="w-full" data-testid="button-submit-feedback">
            <Send className="w-4 h-4 mr-2" />
            Submit Feedback
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Feedback & Requests</h2>
        <div className="space-y-4">
          {(feedbackData as any)?.feedback?.map((item: any) => (
            <FeedbackCard key={item.id} feedback={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
