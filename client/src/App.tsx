import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationContainer } from "@/components/ui/notification";
import { TopNavigation } from "@/components/Layout/TopNavigation";
import { Sidebar } from "@/components/Layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Playground from "@/pages/Playground";
import Models from "@/pages/Models";
import ExternalAPIs from "@/pages/ExternalAPIs";
import CacheStatus from "@/pages/CacheStatus";
import ApiDocumentation from "@/pages/ApiDocumentation";
import ExternalLogs from "@/pages/ExternalLogs";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="min-h-screen bg-background bg-pattern-noise">
      <TopNavigation />
      <div className="flex h-screen pt-12">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-professional bg-pattern-dots relative">
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-transparent to-muted/10" />
          <div className="container mx-auto px-4 pt-4 pb-0 max-w-7xl relative z-10 bg-professional-content">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/playground" component={Playground} />
              <Route path="/models" component={Models} />
              <Route path="/external-apis" component={ExternalAPIs} />
              <Route path="/cache" component={CacheStatus} />
              <Route path="/api-docs" component={ApiDocumentation} />
              <Route path="/external-logs" component={ExternalLogs} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </div>
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
