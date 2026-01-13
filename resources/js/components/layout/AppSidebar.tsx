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
  permissions?: string[];
  external?: boolean;
}

interface MenuSection {
  title: string;
  roles: AppRole[];
  permissions?: string[];
  items: MenuItem[];
}

// Menu organized by functional areas
const menuSections: MenuSection[] = [
  {
    title: "Principal",
    roles: [],
    items: [
      { title: "Tableau de bord", url: "/", icon: LayoutDashboard, roles: [] },
      {
        title: "Messagerie",
        url: "/messages",
        icon: Mail,
        roles: [],
        permissions: ["message.view_any", "message.view"],
      },
    ],
  },
  {
    title: "Gestion Scolaire",
    roles: ["admin", "comptable", "enseignant"],
    permissions: [
      "eleve.view_any",
      "eleve.view",
      "classe.view_any",
      "classe.view",
      "timetable.view_any",
      "timetable.view",
      "absence.view_any",
      "absence.view",
      "note.view_any",
      "note.view",
    ],
    items: [
      {
        title: "Élèves",
        url: "/students",
        icon: Users,
        roles: ["admin", "comptable", "enseignant"],
        permissions: ["eleve.view_any", "eleve.view"],
      },
      {
        title: "Classes",
        url: "/classes",
        icon: BookOpen,
        roles: ["admin", "enseignant"],
        permissions: ["classe.view_any", "classe.view"],
      },
      {
        title: "Emploi du temps",
        url: "/timetable",
        icon: Clock,
        roles: ["admin", "enseignant"],
        permissions: ["timetable.view_any", "timetable.view"],
      },
      {
        title: "Absences",
        url: "/absences",
        icon: UserX,
        roles: ["admin", "enseignant"],
        permissions: ["absence.view_any", "absence.view"],
      },
      {
        title: "Notes",
        url: "/grades",
        icon: ClipboardList,
        roles: ["admin", "enseignant"],
        permissions: ["note.view_any", "note.view"],
      },
    ],
  },
  {
    title: "Finances",
    roles: ["admin", "comptable"],
    permissions: ["paiement.view_any", "paiement.view", "expense.view_any", "expense.view"],
    items: [
      {
        title: "Comptabilité",
        url: "/finances",
        icon: DollarSign,
        roles: ["admin", "comptable"],
        permissions: ["paiement.view_any", "paiement.view", "expense.view_any", "expense.view"],
      },
    ],
  },
  {
    title: "Administration (Filament)",
    roles: ["admin"],
    permissions: ["user.view_any", "user.view"],
    items: [
      { title: "Back-office", url: "/admin", icon: UserCog, roles: ["admin"], external: true, permissions: ["user.view_any", "user.view"] },
      { title: "Personnel", url: "/admin/enseignants", icon: Users, roles: ["admin"], external: true, permissions: ["enseignant.view_any", "enseignant.view"] },
      { title: "Inventaire", url: "/admin/assets", icon: ClipboardList, roles: ["admin"], external: true, permissions: ["asset.view_any", "asset.view"] },
      { title: "Paramètres finance", url: "/admin/parametres-finance", icon: DollarSign, roles: ["admin"], external: true, permissions: ["finance_setting.view_any", "finance_setting.view"] },
      { title: "Salaires", url: "/admin/salaries", icon: Wallet, roles: ["admin"], external: true, permissions: ["salary.view_any", "salary.view"] },
      { title: "Audits enseignants", url: "/admin/teacher-audits", icon: History, roles: ["admin"], external: true, permissions: ["teacher_audit.view_any", "teacher_audit.view"] },
      { title: "Parents", url: "/admin/parents", icon: Users, roles: ["admin"], external: true, permissions: ["parent.view_any", "parent.view"] },
      { title: "Comptes manquants", url: "/admin/comptes-manquants", icon: UserX, roles: ["admin"], external: true, permissions: ["user.view_any", "user.view"] },
    ],
  },
];

export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const { permissions, hasAnyRole, hasAnyPermission } = useUserRole();
  const [openSections, setOpenSections] = useState<string[]>(["Principal", "Gestion Scolaire"]);
  const hasPermissionData = permissions.length > 0;

  const toggleSection = (sectionTitle: string) => {
    setOpenSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const canAccessItem = (item: MenuItem) => {
    if (item.permissions && item.permissions.length > 0 && hasPermissionData) {
      return hasAnyPermission(item.permissions);
    }
    if (item.roles.length === 0) return true;
    return hasAnyRole(item.roles);
  };

  const canAccessSection = (section: MenuSection) => {
    if (section.permissions && section.permissions.length > 0 && hasPermissionData) {
      return hasAnyPermission(section.permissions);
    }
    if (section.roles.length === 0) return true;
    return hasAnyRole(section.roles);
  };

  // Filter sections and items based on permissions/roles
  const visibleSections = menuSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => canAccessItem(item)),
    }))
    .filter(section => {
      // Show section if it has visible items
      if (section.items.length === 0) return false;
      return canAccessSection(section);
    });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          {open && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-sidebar-foreground">SMART-SCHOOL</h1>
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
