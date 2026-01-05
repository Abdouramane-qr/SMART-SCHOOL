import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { laravelFinanceSettingsApi } from "@/services/laravelSchoolApi";
import { CURRENCIES, type Currency } from "@/lib/financeUtils";

export const useFinanceCurrency = () => {
  const settingsQuery = useQuery({
    queryKey: ["laravel", "finance-settings"],
    queryFn: () => laravelFinanceSettingsApi.getAll(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const settings = useMemo<Record<string, string>>(() => {
    const data = settingsQuery.data || [];
    return data.reduce<Record<string, string>>((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});
  }, [settingsQuery.data]);

  const defaultCurrency = useMemo<Currency>(() => {
    const raw = settings.default_currency;
    if (raw && Object.prototype.hasOwnProperty.call(CURRENCIES, raw)) {
      return raw as Currency;
    }
    return "XOF";
  }, [settings.default_currency]);

  return {
    defaultCurrency,
    settings,
    isLoading: settingsQuery.isLoading,
  };
};
