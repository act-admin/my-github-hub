import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Redirect } from "wouter";
import Login from "@/pages/login";

// Protected Route Component
function ProtectedRoute({ component: Component, ...rest }: any) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return isAuthenticated ? <Component {...rest} /> : <Redirect to="/" />;
}

// Lazy load heavy components
const PersonaSelection = React.lazy(() => import("@/pages/persona-selection"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Router>
            <Route path="/" component={Login} />
            <Route path="/dashboard">
              {() => (
                <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <ProtectedRoute component={PersonaSelection} />
                </React.Suspense>
              )}
            </Route>
          </Router>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;