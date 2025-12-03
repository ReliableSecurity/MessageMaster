import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Bell, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Dashboard from "@/pages/dashboard";
import Templates from "@/pages/templates";
import SendingProfiles from "@/pages/sending-profiles";
import Companies from "@/pages/companies";
import Campaigns from "@/pages/campaigns";
import UsersGroups from "@/pages/users-groups";
import LandingPages from "@/pages/landing-pages";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import Landing from "@/pages/landing";
import CampaignResults from "@/pages/campaign-results";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/campaigns/:id" component={CampaignResults} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/users-groups" component={UsersGroups} />
      <Route path="/templates" component={Templates} />
      <Route path="/landing-pages" component={LandingPages} />
      <Route path="/sending-profiles" component={SendingProfiles} />
      <Route path="/companies" component={Companies} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const style = {
    "--sidebar-width": "16rem",
  };

  const userInitials = user 
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const userFullName = user 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
    : 'User';

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          role={user?.role || "manager"} 
          userInitials={userInitials}
          userName={userFullName}
          userEmail={user?.email || ''}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </Button>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={userFullName} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none" data-testid="text-user-name">{userFullName}</p>
                      <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer" data-testid="button-logout">
                    <a href="/api/logout" className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      {t("auth.logout")}
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-8 bg-background">
            <div className="max-w-7xl mx-auto">
              <AuthenticatedRouter />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function LoadingScreen() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
