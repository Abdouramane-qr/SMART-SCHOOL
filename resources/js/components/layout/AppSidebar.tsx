import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  ChevronLeft,
  ClipboardList,
  Clock,
  UserCog,
  UserX,
  Mail,
  ChevronDown,
  Wallet,
  History,
} from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { useState } from "react";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  roles: AppRole[];
  external?: boolean;
}

interface MenuSection {
  title: string;
  roles: AppRole[];
  items: MenuItem[];
}

// Menu organized by functional areas
const menuSections: MenuSection[] = [
  {
    title: "Principal",
    roles: [],
    items: [
      { title: "Tableau de bord", url: "/", icon: LayoutDashboard, roles: [] },
      { title: "Messagerie", url: "/messages", icon: Mail, roles: [] },
    ],
  },
  {
    title: "Gestion Scolaire",
    roles: ["admin", "comptable", "enseignant"],
    items: [
      { title: "Élèves", url: "/students", icon: Users, roles: ["admin", "comptable", "enseignant"] },
      { title: "Classes", url: "/classes", icon: BookOpen, roles: ["admin", "enseignant"] },
      { title: "Emploi du temps", url: "/timetable", icon: Clock, roles: ["admin", "enseignant"] },
      { title: "Absences", url: "/absences", icon: UserX, roles: ["admin", "enseignant"] },
      { title: "Notes", url: "/grades", icon: ClipboardList, roles: ["admin", "enseignant"] },
    ],
  },
  {
    title: "Finances",
    roles: ["admin", "comptable"],
    items: [
      { title: "Comptabilité", url: "/finances", icon: DollarSign, roles: ["admin", "comptable"] },
    ],
  },
  {
    title: "Administration (Filament)",
    roles: ["admin"],
    items: [
      { title: "Back-office", url: "/admin", icon: UserCog, roles: ["admin"], external: true },
      { title: "Personnel", url: "/admin/enseignants", icon: Users, roles: ["admin"], external: true },
      { title: "Inventaire", url: "/admin/assets", icon: ClipboardList, roles: ["admin"], external: true },
      { title: "Paramètres finance", url: "/admin/parametres-finance", icon: DollarSign, roles: ["admin"], external: true },
      { title: "Salaires", url: "/admin/salaries", icon: Wallet, roles: ["admin"], external: true },
      { title: "Audits enseignants", url: "/admin/teacher-audits", icon: History, roles: ["admin"], external: true },
      { title: "Parents", url: "/admin/parents", icon: Users, roles: ["admin"], external: true },
    ],
  },
];

export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const { roles, hasAnyRole, loading } = useUserRole();
  const [openSections, setOpenSections] = useState<string[]>(["Principal", "Gestion Scolaire"]);

  const toggleSection = (sectionTitle: string) => {
    setOpenSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  // Filter sections and items based on user roles
  const visibleSections = menuSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (item.roles.length === 0) return true;
        return hasAnyRole(item.roles);
      }),
    }))
    .filter(section => {
      // Show section if it has visible items
      if (section.items.length === 0) return false;
      // If section has no role requirement, show it
      if (section.roles.length === 0) return true;
      // Otherwise check if user has any of the required roles
      return hasAnyRole(section.roles);
    });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          {open && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-sidebar-foreground">SMART SCHOOL</h1>
                <p className="text-xs text-muted-foreground">Gestion Scolaire</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${!open ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-2">
        {visibleSections.map((section) => (
          <SidebarGroup key={section.title}>
            {open ? (
              <Collapsible
                open={openSections.includes(section.title)}
                onOpenChange={() => toggleSection(section.title)}
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1 transition-colors">
                    <span>{section.title}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        openSections.includes(section.title) ? '' : '-rotate-90'
                      }`}
                    />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                          {item.external ? (
                            <a
                              href={item.url}
                              className="hover:bg-sidebar-accent/50"
                              target="_blank"
                              rel="noreferrer"
                              title={item.title}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </a>
                          ) : (
                            <NavLink
                              to={item.url}
                              end={item.url === "/"}
                              title={item.title}
                              className={({ isActive }) =>
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "hover:bg-sidebar-accent/50"
                              }
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        {item.external ? (
                          <a
                            href={item.url}
                            className="hover:bg-sidebar-accent/50"
                            target="_blank"
                            rel="noreferrer"
                            title={item.title}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </a>
                        ) : (
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            title={item.title}
                            className={({ isActive }) =>
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "hover:bg-sidebar-accent/50"
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
