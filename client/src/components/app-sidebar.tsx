import { LayoutDashboard, Mail, FileText, Users, Settings, BarChart3, Server, User, MessageSquare, Shield } from "lucide-react";
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

interface AppSidebarProps {
  role: "superadmin" | "admin" | "manager";
  userInitials?: string;
  userName?: string;
  userEmail?: string;
}

const superadminItems = [
  { title: "Главная", url: "/", icon: LayoutDashboard },
  { title: "Админ-панель", url: "/admin", icon: Shield },
  { title: "Компании", url: "/companies", icon: Users },
  { title: "Email сервисы", url: "/services", icon: Server },
  { title: "Шаблоны", url: "/global-templates", icon: FileText },
  { title: "Аналитика", url: "/analytics", icon: BarChart3 },
  { title: "Настройки", url: "/settings", icon: Settings },
];

const companyUserItems = [
  { title: "Главная", url: "/", icon: LayoutDashboard },
  { title: "Кампании", url: "/campaigns", icon: Mail },
  { title: "Отклики", url: "/responses", icon: MessageSquare },
  { title: "Шаблоны", url: "/templates", icon: FileText },
  { title: "Контакты", url: "/contacts", icon: Users },
  { title: "Аналитика", url: "/analytics", icon: BarChart3 },
  { title: "Команда", url: "/team", icon: User },
  { title: "Настройки", url: "/settings", icon: Settings },
];

export function AppSidebar({ role, userInitials = "U", userName = "Пользователь", userEmail = "" }: AppSidebarProps) {
  const [location] = useLocation();
  const items = role === "superadmin" ? superadminItems : companyUserItems;
  
  const getRoleBadge = () => {
    if (role === "superadmin") return { label: "Супер-админ", variant: "default" as const };
    if (role === "admin") return { label: "Администратор", variant: "secondary" as const };
    return { label: "Менеджер", variant: "outline" as const };
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
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
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
