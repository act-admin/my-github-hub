import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Cloud,
  Database,
  Tag,
  Check,
  X,
  Plus,
  Upload,
  Download,
  Filter,
  Search,
  Save,
  FolderOpen,
  File,
  Image as ImageIcon,
  FileText,
  Table,
  HardDrive,
  Layers,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DataFeedbackProps {
  persona: string;
}

interface DataItem {
  id: string;
  name: string;
  type: "image" | "document" | "csv" | "json";
  size: string;
  source: string;
  bucket: string;
  tags: string[];
  lastModified: string;
}

export default function DataFeedback({ persona }: DataFeedbackProps) {
  const { toast } = useToast();
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [newTag, setNewTag] = useState("");
  const [filterTag, setFilterTag] = useState("");

  // Mock data sources based on persona
  const getDataSources = () => {
    const commonSources = [
      { id: "aws-s3", name: "AWS S3", icon: Cloud, color: "#FF9900" },
      { id: "azure-blob", name: "Azure Blob Storage", icon: Cloud, color: "#0078D4" },
      { id: "gcp-storage", name: "Google Cloud Storage", icon: Cloud, color: "#4285F4" },
      { id: "local", name: "Local Storage", icon: Database, color: "#6B7280" },
    ];

    if (persona === "finance-accounting") {
      return [...commonSources, 
        { id: "sharepoint", name: "SharePoint", icon: FolderOpen, color: "#0078D4" }
      ];
    }
    return commonSources;
  };

  const getBucketsForSource = (source: string) => {
    const bucketsBySource: Record<string, string[]> = {
      "aws-s3": ["finance-invoices", "vendor-documents", "receipts-2024", "audit-files"],
      "azure-blob": ["financial-reports", "transaction-data", "customer-records"],
      "gcp-storage": ["analytics-data", "backup-storage", "processed-files"],
      "local": ["temp-uploads", "archive"],
      "sharepoint": ["Finance Department", "Audit & Compliance", "Vendor Management"],
    };
    return bucketsBySource[source] || [];
  };

  const getMockData = (): DataItem[] => {
    if (!selectedSource || !selectedBucket) return [];

    const baseData: DataItem[] = [
      {
        id: "1",
        name: "invoice_Q4_2024.pdf",
        type: "document",
        size: "2.4 MB",
        source: selectedSource,
        bucket: selectedBucket,
        tags: ["invoice", "Q4", "approved"],
        lastModified: "2024-11-10",
      },
      {
        id: "2",
        name: "vendor_payment_summary.csv",
        type: "csv",
        size: "156 KB",
        source: selectedSource,
        bucket: selectedBucket,
        tags: ["payment", "vendor", "pending-review"],
        lastModified: "2024-11-12",
      },
      {
        id: "3",
        name: "expense_report_november.xlsx",
        type: "csv",
        size: "890 KB",
        source: selectedSource,
        bucket: selectedBucket,
        tags: ["expense", "november", "completed"],
        lastModified: "2024-11-13",
      },
      {
        id: "4",
        name: "receipt_scan_001.jpg",
        type: "image",
        size: "1.2 MB",
        source: selectedSource,
        bucket: selectedBucket,
        tags: ["receipt", "scan", "untagged"],
        lastModified: "2024-11-14",
      },
      {
        id: "5",
        name: "financial_analysis.json",
        type: "json",
        size: "45 KB",
        source: selectedSource,
        bucket: selectedBucket,
        tags: ["analysis", "financial"],
        lastModified: "2024-11-09",
      },
    ];

    let filtered = baseData;
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterTag) {
      filtered = filtered.filter(item => 
        item.tags.includes(filterTag)
      );
    }
    return filtered;
  };

  const dataItems = getMockData();
  const allTags = Array.from(new Set(dataItems.flatMap(item => item.tags)));

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const addTagToSelected = () => {
    if (!newTag.trim() || selectedItems.size === 0) return;
    
    toast({
      title: "Tags Added",
      description: `Added tag "${newTag}" to ${selectedItems.size} items`,
    });
    setNewTag("");
    setSelectedItems(new Set());
  };

  const saveTagging = () => {
    toast({
      title: "Tagging Saved",
      description: "All tagging changes have been saved to the cloud storage",
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return ImageIcon;
      case "document": return FileText;
      case "csv": return Table;
      case "json": return FileText;
      default: return File;
    }
  };

  return (
    <div className="p-8 space-y-6" data-testid="page-data-feedback">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Data Feedback & Tagging</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect to cloud storage, select data, add tags, and manage your data feedback lifecycle
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Database className="w-4 h-4 text-[#3B5998]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#E8744E]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Available Files</h3>
          <p className="text-sm text-gray-500 mb-3">Files ready for tagging</p>
          <div className="text-3xl font-bold text-gray-900 mb-3">{dataItems.length}</div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-[#3B5998]">Data Storage</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">Files</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full">+2</span>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Check className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Settings className="w-4 h-4 text-[#3B5998]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <File className="w-4 h-4 text-[#14B8A6]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Selected Items</h3>
          <p className="text-sm text-gray-500 mb-3">Items selected for bulk operations</p>
          <div className="text-3xl font-bold text-gray-900 mb-3">{selectedItems.size}</div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-50 text-[#22C55E]">Selection</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">Bulk Ops</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full">+1</span>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Tag className="w-4 h-4 text-[#E8744E]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Filter className="w-4 h-4 text-[#3B5998]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Search className="w-4 h-4 text-[#22C55E]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Unique Tags</h3>
          <p className="text-sm text-gray-500 mb-3">Tags available for filtering</p>
          <div className="text-3xl font-bold text-gray-900 mb-3">{allTags.length}</div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-orange-50 text-[#E8744E]">Tagging</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">Labels</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full">+2</span>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Database className="w-4 h-4 text-[#E8744E]" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-[#3B5998]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Data Sources</h3>
          <p className="text-sm text-gray-500 mb-3">Connected cloud providers</p>
          <div className="text-3xl font-bold text-gray-900 mb-3">{getDataSources().length}</div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-teal-50 text-[#14B8A6]">Cloud Storage</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">AWS</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full">Azure</span>
            <span className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full">+2</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-semibold text-foreground mb-4">Select Data Source</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {getDataSources().map((source) => {
                const Icon = source.icon;
                return (
                  <button
                    key={source.id}
                    onClick={() => {
                      setSelectedSource(source.id);
                      setSelectedBucket("");
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedSource === source.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`button-source-${source.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon style={{ color: source.color }} className="w-6 h-6" />
                      <span className="font-medium text-foreground">{source.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-semibold text-foreground mb-4">Select Bucket / Container</h2>
          <select 
            value={selectedBucket} 
            onChange={(e) => setSelectedBucket(e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background text-foreground"
            data-testid="select-bucket"
          >
            <option value="">Choose a bucket...</option>
            {getBucketsForSource(selectedSource).map((bucket) => (
              <option key={bucket} value={bucket}>
                {bucket}
              </option>
            ))}
          </select>
          {selectedBucket && (
            <p className="text-sm text-muted-foreground mt-2">
              Connected to: {selectedBucket}
            </p>
          )}
        </Card>
      </div>

      {selectedSource && selectedBucket && (
        <>
          <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Files</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by filename..."
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <Label htmlFor="filter">Filter by Tag</Label>
                <select 
                  id="filter"
                  value={filterTag} 
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background text-foreground mt-1"
                  data-testid="select-filter-tag"
                >
                  <option value="">All tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Files & Documents</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground w-12">
                      Select
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                      Size
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                      Tags
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                      Modified
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataItems.map((item) => {
                    const FileIcon = getFileIcon(item.type);
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-border transition-colors ${
                          selectedItems.has(item.id) ? "bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <td className="py-3 px-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            className="w-4 h-4 cursor-pointer"
                            data-testid={`checkbox-item-${item.id}`}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">{item.size}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-muted-foreground">
                          {item.lastModified}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {dataItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No files found. Try adjusting your search or filter.
              </div>
            )}
          </Card>

          <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Bulk Tagging
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-tag">Add New Tag to Selected Items</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="new-tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Enter tag name..."
                      className="flex-1"
                      data-testid="input-new-tag"
                    />
                    <Button 
                      onClick={addTagToSelected} 
                      disabled={!newTag || selectedItems.size === 0}
                      data-testid="button-add-tag"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tag
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedItems.size} item(s) selected
                  </p>
                </div>

                <Button 
                  onClick={saveTagging} 
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A]"
                  data-testid="button-save-tagging"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save All Tagging Changes
                </Button>
              </div>

              <div>
                <Label>Available Tags</Label>
                <div className="mt-2 flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-border min-h-[100px]">
                  {allTags.length > 0 ? (
                    allTags.map((tag) => (
                      <Badge key={tag} variant="default" className="cursor-pointer hover:bg-primary/80">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No tags available</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {(!selectedSource || !selectedBucket) && (
        <Card className="p-12 text-center bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <Cloud className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Connect to a Data Source
          </h3>
          <p className="text-muted-foreground mb-4">
            Select a cloud storage provider and bucket to start managing your data feedback
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="outline">AWS S3</Badge>
            <Badge variant="outline">Azure Blob</Badge>
            <Badge variant="outline">Google Cloud</Badge>
            <Badge variant="outline">SharePoint</Badge>
          </div>
        </Card>
      )}
    </div>
  );
}
