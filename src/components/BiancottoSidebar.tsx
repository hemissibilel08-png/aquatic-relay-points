import { 
  Home, 
  Waves, 
  MapPin, 
  Users, 
  Eye, 
  Settings,
  Trophy,
  Fish
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

const menuItems = [
  { title: "Accueil", url: "/", icon: Home },
  { title: "Centres", url: "/centres", icon: Fish },
  { title: "Stations", url: "/stations", icon: Waves },
  { title: "Facilitateurs", url: "/facilitateurs", icon: Users },
  { title: "REV", url: "/rev", icon: Eye },
  { title: "Records", url: "/records", icon: Trophy },
  { title: "Admin", url: "/admin", icon: Settings },
];

export function BiancottoSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-ocean text-foam font-medium shadow-soft" 
      : "hover:bg-wave/50 transition-smooth";

  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent className="bg-gradient-ocean border-r border-aqua/20">
        {/* Logo/Title */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foam rounded-lg flex items-center justify-center">
              <Fish className="w-5 h-5 text-ocean-primary" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-foam">Biancotto</h1>
                <p className="text-xs text-foam/70">Journées sportives</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-foam/80 font-medium px-6 pb-2">
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent className="px-3">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="mb-1">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className="w-4 h-4 text-foam" />
                      {!collapsed && (
                        <span className="text-foam">{item.title}</span>
                      )}
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