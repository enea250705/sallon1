import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import Services from "@/pages/services";
import Stylists from "@/pages/stylists";
import Clients from "@/pages/clients";
import Settings from "@/pages/settings";
import RecurringReminders from "@/pages/recurring-reminders";
import StylistHours from "@/pages/stylist-hours";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={!isAuthenticated ? Login : Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={isAuthenticated ? Dashboard : Login} />
      <Route path="/calendar" component={isAuthenticated ? Calendar : Login} />
      <Route path="/clients" component={isAuthenticated ? Clients : Login} />
      <Route path="/services" component={isAuthenticated ? Services : Login} />
      <Route path="/stylists" component={isAuthenticated ? Stylists : Login} />
      <Route path="/stylist-hours" component={isAuthenticated ? StylistHours : Login} />
      <Route path="/recurring-reminders" component={isAuthenticated ? RecurringReminders : Login} />
      <Route path="/settings" component={isAuthenticated ? Settings : Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          <Toaster />
          <Router />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
