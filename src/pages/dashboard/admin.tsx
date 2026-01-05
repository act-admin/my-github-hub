import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Hash,
  Table,
  MessageCircle,
  Zap,
  Languages,
  FileDown,
  MessageSquare,
  Type,
  Code2,
  AlignLeft,
  Volume2,
  Mic,
  Music,
  Radio,
  AudioLines,
  Video,
  Film,
  Clapperboard,
  ScanFace,
  Image,
  Palette,
  Sparkles,
  ImagePlus,
  Eye,
} from "lucide-react";

interface PrebuiltAgent {
  id: string;
  name: string;
  icon: any;
  description: string;
  category: string;
  status: "active" | "beta" | "coming-soon";
}

const prebuiltAgents: PrebuiltAgent[] = [
  // Natural Language Processing
  {
    id: "text-classification",
    name: "Text Classification",
    icon: FileText,
    description: "Classify text into predefined categories",
    category: "Natural Language Processing",
    status: "active",
  },
  {
    id: "token-classification",
    name: "Token Classification",
    icon: Hash,
    description: "Identify and classify tokens in text",
    category: "Natural Language Processing",
    status: "active",
  },
  {
    id: "table-qa",
    name: "Table Question Answering",
    icon: Table,
    description: "Answer questions based on tabular data",
    category: "Natural Language Processing",
    status: "active",
  },
  {
    id: "question-answering",
    name: "Question Answering",
    icon: MessageCircle,
    description: "Extract answers from context passages",
    category: "Natural Language Processing",
    status: "active",
  },
  {
    id: "zero-shot",
    name: "Zero-Shot Classification",
    icon: Zap,
    description: "Classify without training examples",
    category: "Natural Language Processing",
    status: "active",
  },
  {
    id: "translation",
    name: "Translation",
    icon: Languages,
    description: "Translate text between languages",
    category: "Natural Language Processing",
    status: "active",
  },
  {
    id: "summarization",
    name: "Summarization",
    icon: FileDown,
    description: "Generate concise summaries of text",
    category: "Natural Language Processing",
    status: "active",
  },
  {
    id: "conversational",
    name: "Conversational",
    icon: MessageSquare,
    description: "Build conversational AI assistants",
    category: "Natural Language Processing",
    status: "active",
  },
  {
    id: "text-generation",
    name: "Text Generation",
    icon: Type,
    description: "Generate coherent and contextual text",
    category: "Natural Language Processing",
    status: "active",
  },
  {
    id: "text2text",
    name: "Text2Text Generation",
    icon: Code2,
    description: "Transform text from one form to another",
    category: "Natural Language Processing",
    status: "active",
  },
  {
    id: "sentence-similarity",
    name: "Sentence Similarity",
    icon: AlignLeft,
    description: "Measure semantic similarity between texts",
    category: "Natural Language Processing",
    status: "active",
  },

  // Audio
  {
    id: "text-to-speech",
    name: "Text-to-Speech",
    icon: Volume2,
    description: "Convert text to natural sounding speech",
    category: "Audio",
    status: "active",
  },
  {
    id: "speech-recognition",
    name: "Automatic Speech Recognition",
    icon: Mic,
    description: "Transcribe audio to text accurately",
    category: "Audio",
    status: "active",
  },
  {
    id: "audio-to-audio",
    name: "Audio-to-Audio",
    icon: AudioLines,
    description: "Transform audio signals and enhance quality",
    category: "Audio",
    status: "active",
  },
  {
    id: "audio-classification",
    name: "Audio Classification",
    icon: Music,
    description: "Classify audio content and sounds",
    category: "Audio",
    status: "active",
  },
  {
    id: "voice-activity",
    name: "Voice Activity Detection",
    icon: Radio,
    description: "Detect human voice in audio streams",
    category: "Audio",
    status: "active",
  },

  // Video
  {
    id: "video-classification",
    name: "Video Classification",
    icon: Video,
    description: "Classify video content and scenes",
    category: "Video",
    status: "active",
  },
  {
    id: "object-detection",
    name: "Object Detection",
    icon: ScanFace,
    description: "Detect and track objects in video",
    category: "Video",
    status: "active",
  },
  {
    id: "action-recognition",
    name: "Action Recognition",
    icon: Film,
    description: "Recognize actions and activities in video",
    category: "Video",
    status: "active",
  },
  {
    id: "video-captioning",
    name: "Video Captioning",
    icon: Clapperboard,
    description: "Generate descriptions for video content",
    category: "Video",
    status: "beta",
  },

  // Computer Vision
  {
    id: "image-classification",
    name: "Image Classification",
    icon: Image,
    description: "Classify images into categories",
    category: "Computer Vision",
    status: "active",
  },
  {
    id: "image-segmentation",
    name: "Image Segmentation",
    icon: Palette,
    description: "Segment images into meaningful regions",
    category: "Computer Vision",
    status: "active",
  },
  {
    id: "object-detection-cv",
    name: "Object Detection",
    icon: Eye,
    description: "Detect objects in images",
    category: "Computer Vision",
    status: "active",
  },
  {
    id: "image-generation",
    name: "Image Generation",
    icon: Sparkles,
    description: "Generate images from text descriptions",
    category: "Computer Vision",
    status: "beta",
  },
  {
    id: "image-to-image",
    name: "Image-to-Image",
    icon: ImagePlus,
    description: "Transform images with AI",
    category: "Computer Vision",
    status: "active",
  },
];

const categories = [
  "Natural Language Processing",
  "Audio",
  "Video",
  "Computer Vision",
];

export default function Admin() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = prebuiltAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "beta":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "coming-soon":
        return "bg-gray-500/10 text-gray-700 border-gray-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-8 space-y-8" data-testid="page-admin">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore prebuilt AI agents to automate your workflows
          </p>
        </div>

        <div className="max-w-md">
          <Input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11"
            data-testid="input-search-admin-agents"
          />
        </div>

        {categories.map((category) => {
          const categoryAgents = filteredAgents.filter(
            (agent) => agent.category === category
          );

          if (categoryAgents.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground/70 italic">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryAgents.map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <Card
                      key={agent.id}
                      className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer group"
                      data-testid={`card-agent-${agent.id}`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-[#3B5998]" />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-[#22C55E]" />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-[#E8744E]" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                        {agent.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                          agent.status === "active" ? "bg-green-50 text-[#22C55E]" :
                          agent.status === "beta" ? "bg-blue-50 text-[#3B5998]" :
                          "bg-gray-50 text-gray-500"
                        }`}>
                          {agent.status === "coming-soon" ? "Soon" : agent.status}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-orange-50 text-[#E8744E]">
                          {agent.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">AI Model</span>
                        <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">Automation</span>
                        <span className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full">+2</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredAgents.length === 0 && (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No agents found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search query
            </p>
          </Card>
        )}
    </div>
  );
}
