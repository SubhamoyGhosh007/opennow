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
} from "lucide-react";

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
        { title: "Incidents", url: "/workspace/incident" },
        { title: "Changes", url: "/workspace/change" },
        { title: "Problems", url: "/workspace/problem" },
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
        { title: "Catalog Item Builder", url: "/workspace/catalog-builder" },
      ],
    },
  ],
  queues: [
    {
      name: "Service Desk Intake",
      url: "/workspace/incident",
      icon: Inbox,
    },
    {
      name: "Network Infrastructure",
      url: "/workspace/incident",
      icon: Server,
    },
    {
      name: "Change Advisory Board",
      url: "/workspace/change",
      icon: ShieldAlert,
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
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  if (!activeTeam) {
    return null;
  }

  const LogoIcon = activeTeam.logo;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[hsl(var(--signal))] text-black font-bold">
                <LogoIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold">{activeTeam.name}</span>
                <span className="truncate text-[10px] text-muted-foreground">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Environments & Tenants
              </DropdownMenuLabel>
              {teams.map((team, index) => {
                const TLogo = team.logo;
                return (
                  <DropdownMenuItem
                    key={team.name}
                    onClick={() => setActiveTeam(team)}
                    className="gap-2 p-2 cursor-pointer"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <TLogo className="size-3.5 shrink-0" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{team.name}</span>
                      <span className="text-[10px] text-muted-foreground">{team.plan}</span>
                    </div>
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ElementType;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform & Operations</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
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
}: {
  queues: {
    name: string;
    url: string;
    icon: React.ElementType;
  }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Routing Groups</SidebarGroupLabel>
      <SidebarMenu>
        {queues.map((item) => {
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
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold">{name}</span>
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
                  <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-primary/20 text-[11px] font-bold text-primary">
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={DATA.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={DATA.navMain} />
        <NavQueues queues={DATA.queues} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
