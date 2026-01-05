import React, { useEffect } from "react"; // v1
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Redirect } from "wouter";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/lib/authConfig";
import PersonaSelection from "@/pages/persona-selection";
import Login from "@/pages/login";

const msalInstance = new PublicClientApplication(msalConfig);

// Protected Route Component
function ProtectedRoute({ component: Component, ...rest }: any) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return isAuthenticated ? <Component {...rest} /> : <Redirect to="/" />;
}

function App() {
  useEffect(() => {
    // Clear all caches on app load to ensure fresh data
    queryClient.clear();
    queryClient.invalidateQueries();
  }, []);

  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Router>
              <Route path="/" component={Login} />
              <Route path="/dashboard">
                {() => <ProtectedRoute component={PersonaSelection} />}
              </Route>
            </Router>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </MsalProvider>
  );
}

export default App;
