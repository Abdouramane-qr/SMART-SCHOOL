import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppConfigProvider } from "@/contexts/AppConfigContext";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Finances from "./pages/Finances";
import Grades from "./pages/Grades";
import Timetable from "./pages/Timetable";
import Profile from "./pages/Profile";
import Absences from "./pages/Absences";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const AdminRedirect = () => {
  if (typeof window !== "undefined") {
    window.location.href = "/admin";
  }
  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppConfigProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/users" element={<AdminRedirect />} />
                <Route path="/subjects" element={<AdminRedirect />} />
                <Route path="/school-years" element={<AdminRedirect />} />
                <Route path="/classrooms" element={<AdminRedirect />} />
                <Route path="/assets" element={<AdminRedirect />} />
                <Route path="/staff" element={<AdminRedirect />} />
                <Route path="/settings" element={<AdminRedirect />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/students"
                  element={
                    <ProtectedRoute requiredRoles={["admin", "comptable", "enseignant"]}>
                      <DashboardLayout>
                        <Students />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/classes"
                  element={
                    <ProtectedRoute requiredRoles={["admin", "enseignant"]}>
                      <DashboardLayout>
                        <Classes />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/finances"
                  element={
                    <ProtectedRoute requiredRoles={["admin", "comptable"]}>
                      <DashboardLayout>
                        <Finances />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/grades"
                  element={
                    <ProtectedRoute requiredRoles={["admin", "enseignant"]}>
                      <DashboardLayout>
                        <Grades />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable"
                  element={
                    <ProtectedRoute requiredRoles={["admin", "enseignant"]}>
                      <DashboardLayout>
                        <Timetable />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Profile />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/absences"
                  element={
                    <ProtectedRoute requiredRoles={["admin", "enseignant"]}>
                      <DashboardLayout>
                        <Absences />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Messages />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppConfigProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
