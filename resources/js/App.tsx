import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppConfigProvider } from "@/contexts/AppConfigContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Students = lazy(() => import("./pages/Students"));
const Classes = lazy(() => import("./pages/Classes"));
const Finances = lazy(() => import("./pages/Finances"));
const Grades = lazy(() => import("./pages/Grades"));
const Timetable = lazy(() => import("./pages/Timetable"));
const Profile = lazy(() => import("./pages/Profile"));
const Absences = lazy(() => import("./pages/Absences"));
const Messages = lazy(() => import("./pages/Messages"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminRedirect = () => {
  if (typeof window !== "undefined") {
    window.location.href = "/admin";
  }
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppConfigProvider>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-neutral" />
                  </div>
                }
              >
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
              </Suspense>
            </AppConfigProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
