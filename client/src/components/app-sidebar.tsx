import { LayoutDashboard, Mail, FileText, Users, Settings, BarChart3, Server, Shield, Globe, Send } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/lib/i18n";

interface AppSidebarProps {
  role: "superadmin" | "admin" | "manager" | "viewer";
  userInitials?: string;
  userName?: string;
  userEmail?: string;
}

export function AppSidebar({ role, userInitials = "U", userName = "User", userEmail = "" }: AppSidebarProps) {
  const [location] = useLocation();
  const { t, language } = useLanguage();
  
  const superadminItems = [
    { title: t("nav.dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("nav.admin"), url: "/admin", icon: Shield },
    { title: t("nav.campaigns"), url: "/campaigns", icon: Send },
    { title: t("nav.usersGroups"), url: "/users-groups", icon: Users },
    { title: t("nav.templates"), url: "/templates", icon: Mail },
    { title: t("nav.landingPages"), url: "/landing-pages", icon: Globe },
    { title: t("nav.sendingProfiles"), url: "/sending-profiles", icon: Server },
    { title: t("nav.settings"), url: "/settings", icon: Settings },
  ];

  const companyUserItems = [
    { title: t("nav.dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("nav.campaigns"), url: "/campaigns", icon: Send },
    { title: t("nav.usersGroups"), url: "/users-groups", icon: Users },
    { title: t("nav.templates"), url: "/templates", icon: Mail },
    { title: t("nav.landingPages"), url: "/landing-pages", icon: Globe },
    { title: t("nav.sendingProfiles"), url: "/sending-profiles", icon: Server },
    { title: t("nav.settings"), url: "/settings", icon: Settings },
  ];

  const viewerItems = [
    { title: t("nav.dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("nav.campaigns"), url: "/campaigns", icon: Send },
    { title: t("nav.settings"), url: "/settings", icon: Settings },
  ];
  
  const items = role === "superadmin" ? superadminItems : role === "viewer" ? viewerItems : companyUserItems;
  
  const getRoleBadge = () => {
    if (role === "superadmin") return { label: language === "ru" ? "Супер-админ" : "Super Admin", variant: "default" as const };
    if (role === "admin") return { label: language === "ru" ? "Администратор" : "Administrator", variant: "secondary" as const };
    if (role === "viewer") return { label: language === "ru" ? "Просмотрщик" : "Viewer", variant: "outline" as const };
    return { label: language === "ru" ? "Менеджер" : "Manager", variant: "outline" as const };
  };

  const roleBadge = getRoleBadge();

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-sidebar-foreground">PhishGuard</h2>
          </div>
        </div>
        <div className="mt-4">
          <Badge variant={roleBadge.variant} className="text-xs" data-testid={`badge-role-${role}`}>
            {roleBadge.label}
          </Badge>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-sidebar-user-name">{userName}</p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-sidebar-user-email">{userEmail}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
