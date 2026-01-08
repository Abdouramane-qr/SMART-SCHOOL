import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AIAssistant } from "@/components/AIAssistant";
import { Bell, Search, LogOut, User, Settings, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { laravelMessagesApi } from "@/services/laravelSchoolApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = window.setInterval(fetchUnreadCount, 10000);
      return () => {
        window.clearInterval(interval);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const inbox = await laravelMessagesApi.getInbox();
      const unreadCount = inbox.filter((message) => !message.is_read).length;
      setUnreadMessages(unreadCount);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching unread count:", error);
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Navbar */}
          <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-3 md:px-6">
              <SidebarTrigger className="-ml-1 md:-ml-2" />
              
              {/* Search - hidden on mobile */}
              <div className="flex-1 hidden md:flex items-center gap-4">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher élèves, classes..."
                    className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                  />
                </div>
              </div>

              {/* Mobile search button */}
              <Button variant="ghost" size="icon" className="md:hidden flex-1 justify-start">
                <Search className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-1 md:gap-2">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Messages */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate("/messages")}
                >
                  <Mail className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                </Button>
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover border border-border z-50">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">Mon compte</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email || "utilisateur@email.com"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 md:p-6 overflow-auto">
            {children}
          </main>
          
          {/* AI Assistant */}
          <AIAssistant />
        </div>
      </div>
    </SidebarProvider>
  );
}
