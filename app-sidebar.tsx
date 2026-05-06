import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, HeartPulse, LineChart, Sparkles, Stethoscope } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Risk Assessment", url: "/", icon: Stethoscope },
  { title: "Health Trends", url: "/trends", icon: LineChart },
  { title: "Recommendations", url: "/recommendations", icon: Sparkles },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-clinical)] shadow-[var(--shadow-glow)]">
            <HeartPulse className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">CardioIQ</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Risk Intelligence
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Clinical</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={path === it.url}>
                    <Link to={it.url}>
                      <it.icon />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Status</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-[color:var(--success)]" />
                <span>3 models online</span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
