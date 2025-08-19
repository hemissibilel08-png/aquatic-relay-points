import { 
  Home, 
  Fish, 
  Waves, 
  Trophy, 
  Users, 
  Shield, 
  Settings,
  Anchor,
  QrCode
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSessionCentre } from "@/hooks/useSessionCentre";

const navigationItems = [
  { title: "Accueil", url: "/", icon: Home },
  { title: "Mon Centre", url: "/centre", icon: Fish },
  { title: "Stations", url: "/stations", icon: Waves },
  { title: "Records", url: "/records", icon: Trophy },
];

const staffItems = [
  { title: "Facilitateurs", url: "/facilitateurs", icon: Users },
  { title: "Responsable", url: "/rev", icon: Shield },
];

const adminItems = [
  { title: "Administration", url: "/admin", icon: Settings },
  { title: "Gestion Centres", url: "/centres", icon: Fish },
];

export function BiancottoSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { sessionCentre, isSessionActive } = useSessionCentre();
  
  const collapsed = !open;
  
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };
  
  const getNavClass = (active: boolean) =>
    active 
      ? "bg-ocean-primary/10 text-ocean-primary font-medium border-r-2 border-ocean-primary" 
      : "hover:bg-ocean-light/10 text-muted-foreground hover:text-ocean-primary";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-foam to-wave/50">
        {/* Header */}
        <div className={`p-4 border-b border-ocean-light/20 ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-ocean rounded-lg flex items-center justify-center">
              <Anchor className="w-5 h-5 text-foam" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-ocean-deep">Biancotto</h2>
                <p className="text-xs text-muted-foreground">Sports Maritimes</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation principale */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => getNavClass(isActive)}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Staff */}
        <SidebarGroup>
          <SidebarGroupLabel>Équipe</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {staffItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => getNavClass(isActive)}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration */}
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => getNavClass(isActive)}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}