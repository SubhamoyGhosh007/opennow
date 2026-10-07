"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  AudioWaveform,
  BadgeCheck,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  Command,
  CreditCard,
  Folder,
  Forward,
  Frame,
  GalleryVerticalEnd,
  LogOut,
  Map,
  MoreHorizontal,
  PieChart,
  Plus,
  Settings2,
  Sparkles,
  SquareTerminal,
  Trash2,
  Inbox,
  FolderKanban,
  TicketCheck,
  Database,
  Layers,
  Users,
  Settings,
  PlusCircle,
  LayoutDashboard,
  ShieldAlert,
  Server,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { TransitionLink } from "@/components/motion/nav-transition";

const ITIL_ROLES = ["admin", "itil", "itil_admin"];

const DATA = {
  teams: [
    {
      name: "OpenNow Enterprise",
      logo: GalleryVerticalEnd,
      plan: "Production (us-east-1)",
    },
    {
      name: "ITSM Staging Sandbox",
      logo: AudioWaveform,
      plan: "Pre-Release v16.3",
    },
    {
      name: "Disaster Recovery",
      logo: Command,
      plan: "Hot Standby (eu-central-1)",
    },
  ],
  navMain: [
    {
      title: "Workspace",
      url: "/workspace",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Command Center", url: "/workspace" },
        { title: "My Tickets", url: "/tickets" },
        { title: "System Settings", url: "/settings" },
      ],
    },
    {
      title: "ITSM Queues",
      url: "/workspace/incident",
      icon: Inbox,
      isActive: true,
      items: [
        { title: "Incidents", url: "/workspace/incident", roles: ITIL_ROLES },
        { title: "Changes", url: "/workspace/change", roles: ITIL_ROLES },
        { title: "Problems", url: "/workspace/problem", roles: ITIL_ROLES },
      ],
    },
    {
      title: "Configuration & CMDB",
      url: "/workspace/cmdb",
      icon: Database,
      items: [
        { title: "CI Explorer", url: "/workspace/cmdb" },
        { title: "Dependency Graph", url: "/workspace/cmdb" },
      ],
    },
    {
      title: "Knowledge Base",
      url: "/workspace/knowledge",
      icon: BookOpen,
      items: [
        { title: "Fulfiller Articles", url: "/workspace/knowledge" },
        { title: "Employee Self-Help", url: "/kb" },
      ],
    },
    {
      title: "Service Catalog",
      url: "/catalog",
      icon: PlusCircle,
      items: [
        { title: "Browse Catalog", url: "/catalog" },
        { title: "Catalog Item Builder", url: "/workspace/catalog-builder", roles: ITIL_ROLES },
      ],
    },
    {
      title: "Administration",
      url: "/admin/users",
      icon: Settings2,
      items: [
        { title: "Users & access", url: "/admin/users", roles: ["admin"] },
      ],
    },
  ],
  queues: [
    {
      name: "Service Desk Intake",
      url: "/workspace/incident",
      icon: Inbox,
      roles: ITIL_ROLES,
    },
    {
      name: "Network Infrastructure",
      url: "/workspace/incident",
      icon: Server,
      roles: ITIL_ROLES,
    },
    {
      name: "Change Advisory Board",
      url: "/workspace/change",
      icon: ShieldAlert,
      roles: ITIL_ROLES,
    },
  ],
};

function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const team = teams[0];
  if (!team) {
    return null;
  }

  const LogoIcon = team.logo;

  // Static environment badge: the backend is single-tenant, so there is no
  // per-team dataset to switch between. A dropdown here would lie.
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5" title="Single-tenant workspace">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[var(--ls-lime,#c8ff00)] text-[var(--ls-ink,#0d2833)] font-bold shadow-sm">
            <LogoIcon className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-xs leading-tight">
            <span className="truncate font-semibold">{team.name}</span>
            <span className="truncate text-[10px] text-muted-foreground">{team.plan}</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function canSee(roles: string[] | undefined, userRoles: string[]): boolean {
  if (!roles) return true;
  return roles.some((r) => userRoles.includes(r));
}

function NavMain({
  items,
  userRoles,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ElementType;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      roles?: string[];
    }[];
  }[];
  userRoles: string[];
}) {
  const pathname = usePathname();
  const visible = items
    .map((g) => ({ ...g, items: g.items?.filter((s) => canSee(s.roles, userRoles)) }))
    .filter((g) => (g.items?.length ?? 1) > 0);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform & Operations</SidebarGroupLabel>
      <SidebarMenu>
        {visible.map((item) => {
          const Icon = item.icon;
          const isGroupActive = item.items?.some((sub) => pathname === sub.url || pathname.startsWith(sub.url + "/"));

          return (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive || isGroupActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isActive = pathname === subItem.url;
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <TransitionLink href={subItem.url} direction="nav-forward">
                              <span>{subItem.title}</span>
                            </TransitionLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavQueues({
  queues,
  userRoles,
}: {
  queues: {
    name: string;
    url: string;
    icon: React.ElementType;
    roles?: string[];
  }[];
  userRoles: string[];
}) {
  const visible = queues.filter((q) => canSee(q.roles, userRoles));
  if (visible.length === 0) return null;
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Routing Groups</SidebarGroupLabel>
      <SidebarMenu>
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <TransitionLink href={item.url} direction="nav-forward">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </TransitionLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavUser() {
  const { isMobile } = useSidebar();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();

  const name = session?.user?.name || "Service Console";
  const email = session?.user?.email || "fulfiller@opennow.local";
  const roles: string[] = ((session?.user as any)?.roles || ["itil"]) as string[];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[var(--ls-ink,#0d2833)] text-xs font-bold text-[var(--ls-lime,#c8ff00)] shadow-sm">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold text-[var(--ls-ink,#0d2833)]">{name}</span>
                <span className="truncate text-[10px] text-muted-foreground">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-xs">
                  <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-[var(--ls-ink,#0d2833)] text-[11px] font-bold text-[var(--ls-lime,#c8ff00)]">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="grid flex-1 text-left text-xs leading-tight">
                    <span className="truncate font-semibold">{name}</span>
                    <span className="truncate text-[10px] text-muted-foreground">{roles.join(", ")}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <TransitionLink href="/settings">
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Account & Profile
                </TransitionLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <TransitionLink href="/tickets">
                  <TicketCheck className="mr-2 h-4 w-4" />
                  My Assigned Tickets
                </TransitionLink>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="cursor-pointer"
              >
                {resolvedTheme === "dark" ? (
                  <>
                    <Sun className="mr-2 h-4 w-4 text-amber-400" />
                    Switch to Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4 text-[var(--ls-ink,#0d2833)]" />
                    Switch to Dark Mode
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="cursor-pointer text-rose-500 focus:text-rose-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const userRoles: string[] = ((session?.user as any)?.roles || []) as string[];
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={DATA.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={DATA.navMain} userRoles={userRoles} />
        <NavQueues queues={DATA.queues} userRoles={userRoles} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
