import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  User,
  Headphones,
  Briefcase,
  Wrench,
  Code,
  FlaskConical,
  Users,
  Megaphone,
  DollarSign,
  Scale,
  Crown,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Database,
  Activity,
  Settings,
  BarChart3,
  Zap,
  Home,
  LogOut,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import scodacLogo from "@assets/ScodacLogoApproved.png";
import scodacIcon from "@assets/scodac-favicon.png";
import billionIcon from "@assets/billionicon.png";
import NLQInterface from "@/components/nlq-interface";
import AutomationDashboard from "@/pages/dashboard/automation-dashboard";
import Analytics from "@/pages/dashboard/analytics";
import Feedback from "@/pages/dashboard/feedback";
import DataFeedback from "@/pages/dashboard/data-feedback";
import Agents from "@/pages/dashboard/agents";
import Admin from "@/pages/dashboard/admin";

const personas = [
  {
    id: "customer-service",
    name: "Customer Service",
    icon: Headphones,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    route: null,
  },
  {
    id: "it",
    name: "IT",
    icon: Wrench,
    color: "text-red-500",
    bgColor: "bg-red-50",
    route: null,
  },
  {
    id: "finance-accounting",
    name: "Finance and Accounting",
    icon: Briefcase,
    color: "text-green-600",
    bgColor: "bg-green-50",
    route: null,
  },
  {
    id: "sales",
    name: "Sales",
    icon: DollarSign,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    route: null,
  },
  {
    id: "leadership",
    name: "Leadership",
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    route: null,
  },
  {
    id: "legal-compliance",
    name: "Legal and Compliance",
    icon: Scale,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    route: null,
  },
  {
    id: "human-resources",
    name: "Human Resources",
    icon: Users,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    route: null,
  },
  {
    id: "generic",
    name: "Generic",
    icon: Box,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    route: null,
  },
  {
    id: "administrator",
    name: "Administrator",
    icon: Settings,
    color: "text-teal-500",
    bgColor: "bg-teal-50",
    route: null,
  },
  {
    id: "procurement",
    name: "Procurement",
    icon: BarChart3,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    route: null,
  },
];

// Icon navigation items for sidebar
const sidebarNavItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    fullLabel: "Automation Overview",
  },
  {
    icon: Megaphone,
    label: "Feedback",
    fullLabel: "Feedback Requests",
  },
  {
    icon: Tag,
    label: "Data Feedback",
    fullLabel: "Data Feedback",
  },
  {
    icon: Database,
    label: "Repository",
    fullLabel: "Agents Repository",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    fullLabel: "Usage Analytics",
  },
  { icon: Activity, label: "Admin", fullLabel: "Admin Panel" },
  // { icon: Code, label: "Code", fullLabel: "Code" },
  // { icon: Zap, label: "Integrations", fullLabel: "Integrations" },
  // { icon: Users, label: "Team", fullLabel: "Team" },
  // { icon: Wrench, label: "Tools", fullLabel: "Tools" },
  { icon: Settings, label: "Settings", fullLabel: "Settings" },
];

export default function PersonaSelection() {
  const [, setLocation] = useLocation();
  const [selectedPersona, setSelectedPersona] = useState<string | null>(
    "generic",
  );
  const [activeNavItem, setActiveNavItem] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handlePersonaClick = (persona: (typeof personas)[0]) => {
    if (persona.route) {
      setLocation(persona.route);
    }
  };

  const handleDropdownSelect = (personaId: string) => {
    setSelectedPersona(personaId);
  };

  const getCurrentDate = () => {
    const today = new Date();
    const day = today.getDate();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = monthNames[today.getMonth()];
    return `Today: ${day} ${month}`;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Expandable */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-sidebar border-r border-sidebar-border flex flex-col ${sidebarOpen ? "items-start" : "items-center"} py-3 flex-shrink-0 transition-all duration-300 relative`}
      >
        {/* Logo Icon */}
        <div
          className={`h-20 flex items-center ${sidebarOpen ? "px-4 w-full" : "justify-center"} -mt-2`}
        >
          <img
            src={sidebarOpen ? scodacLogo : scodacIcon}
            alt="SCODAC"
            className={`${sidebarOpen ? "h-12 w-auto" : "w-12 h-12"} rounded-lg transition-all duration-300`}
            data-testid="img-sidebar-logo"
          />
        </div>

        {/* Home Icon */}
        <div className={`mb-8 ${sidebarOpen ? "w-full px-4" : ""}`}>
          <button
            onClick={() => {
              setSelectedPersona("generic");
              setActiveNavItem("");
            }}
            className={`${sidebarOpen ? "w-full justify-start px-3" : "w-10 justify-center"} h-10 rounded-lg flex items-center gap-3 transition-colors ${
              selectedPersona === "generic" && activeNavItem === ""
                ? "bg-blue-50 text-[#3B5998]"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            title="Home"
            data-testid="button-home"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Home</span>}
          </button>
        </div>

        {/* Navigation Icons */}
        <nav
          className={`flex-1 flex flex-col ${sidebarOpen ? "w-full px-4" : "items-center"} space-y-2`}
        >
          {sidebarNavItems
            .filter((item) => item.label !== "User")
            .map((item, index) => {
              const Icon = item.icon;
              const isActive = activeNavItem === item.label;

              return (
                <button
                  key={index}
                  onClick={() => setActiveNavItem(item.label)}
                  className={`${sidebarOpen ? "w-full justify-start px-3" : "w-10 justify-center"} 
                              h-10 py-5 rounded-xl flex items-center gap-3 transition-colors 
                              ${
                                isActive
                                  ? "bg-blue-50 text-[#3B5998] font-medium"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                  title={item.label}
                  data-testid={`sidebar-icon-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm text-start font-medium">
                      {item.fullLabel}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Toggle Button - Right edge of sidebar, aligned with header center */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              setHoverTimeout(null);
            }
            if (sidebarOpen) {
              setSidebarOpen(false);
            }
          }}
          onMouseEnter={() => {
            if (!sidebarOpen) {
              const timeout = setTimeout(() => {
                setSidebarOpen(true);
              }, 100);
              setHoverTimeout(timeout);
            }
          }}
          onMouseLeave={() => {
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              setHoverTimeout(null);
            }
          }}
          className="absolute -right-3 top-6 w-6 h-8 bg-white border border-border rounded-r-lg flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all z-10"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          data-testid="button-sidebar-toggle"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Logout Icon at Bottom */}
        <div className={`mt-auto ${sidebarOpen ? "w-full px-4" : ""}`}>
          <button
            onClick={() => {
              localStorage.removeItem("isAuthenticated");
              localStorage.removeItem("userEmail");
              setLocation("/");
            }}
            className={`${sidebarOpen ? "w-full justify-start px-3" : "w-10 justify-center"} h-10 rounded-lg flex items-center gap-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors`}
            title="Logout"
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between gap-6 flex-shrink-0 h-20">
          {/* Left Side - Billion Dollar Blank Screen */}
          <div className="flex items-center gap-3">
            {/* <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setLocation("/")}>
              <img
                src={billionIcon}
                alt="Billion Dollar Blank Screen"
                className="w-full h-full object-cover"
              />
            </div> */}
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground">
                Billion $ Blank Screen
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Your personal AI Assistant for work
                </span>
                {/* <span className="text-sm text-muted-foreground">
                  {selectedPersona && selectedPersona !== "generic"
                    ? `${personas.find(p => p.id === selectedPersona)?.name} Orchestration Platform`
                    : "AI Orchestration Platform"}
                </span>
                {selectedPersona && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">Active</span>
                  </div>
                )} */}
              </div>
            </div>
          </div>

          {/* Right Side - Dropdown */}
          <div className="flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="px-4 py-2 text-[#2E5AAC] border border-[#2E5AAC]/30 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center gap-2"
                  data-testid="button-select-persona"
                >
                  Role
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {personas.map((persona) => {
                  const Icon = persona.icon;
                  const isSelected = selectedPersona === persona.id;
                  return (
                    <DropdownMenuItem
                      key={persona.id}
                      onClick={() => handleDropdownSelect(persona.id)}
                      className="cursor-pointer"
                      data-testid={`menu-item-${persona.id}`}
                    >
                      <Icon className={`mr-2 h-4 w-4 ${persona.color}`} />
                      <span className="flex-1">{persona.name}</span>
                      {isSelected && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></div>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background pb-16">
          {activeNavItem === "" && (
            <NLQInterface
              hideSidebar={true}
              showHeader={true}
              pageTitle="Billion Dollar Blank Screen"
              showFooter={true}
            />
          )}
          {activeNavItem === "Dashboard" && (
            <AutomationDashboard persona={selectedPersona || "generic"} />
          )}
          {activeNavItem === "Analytics" && (
            <Analytics persona={selectedPersona || "generic"} />
          )}
          {activeNavItem === "Feedback" && (
            <Feedback persona={selectedPersona || "generic"} />
          )}
          {activeNavItem === "Data Feedback" && (
            <DataFeedback persona={selectedPersona || "generic"} />
          )}
          {activeNavItem === "Repository" && (
            <Agents persona={selectedPersona || "generic"} />
          )}
          {activeNavItem === "Admin" && <Admin />}
          {activeNavItem &&
            ![
              "Dashboard",
              "Analytics",
              "Feedback",
              "Data Feedback",
              "Repository",
              "Admin",
              "",
            ].includes(activeNavItem) && (
              <div className="p-8" data-testid="page-coming-soon">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {activeNavItem}
                </h1>
                <p className="text-muted-foreground">Coming soon...</p>
              </div>
            )}
        </main>
      </div>

      {/* Fixed Footer - positioned next to sidebar */}
      <div
        className={`fixed bottom-0 ${sidebarOpen ? "left-64" : "left-20"} right-0 bg-card border-t border-border py-3 z-40 transition-all duration-300`}
      >
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            2025©SCODAC Inc All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
