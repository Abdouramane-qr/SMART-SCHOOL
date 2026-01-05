import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { laravelSchoolYearsApi, type LaravelSchoolYear } from "@/services/laravelSchoolApi";
import { useAuthContext } from "@/contexts/AuthContext";

interface AppConfigContextValue {
  schoolYear: LaravelSchoolYear | null;
  schoolId: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextValue | undefined>(undefined);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [schoolYear, setSchoolYear] = useState<LaravelSchoolYear | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const current = await laravelSchoolYearsApi.getCurrent();
      setSchoolYear(current);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setSchoolYear(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [user]);

  const schoolId = useMemo(() => {
    return schoolYear?.school_id ?? null;
  }, [schoolYear]);

  return (
    <AppConfigContext.Provider value={{ schoolYear, schoolId, loading, refresh }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error("useAppConfig must be used within AppConfigProvider");
  }
  return context;
}
