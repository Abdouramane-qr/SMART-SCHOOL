import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Finances from "@/pages/Finances";

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({
    hasAnyRole: () => false,
    hasAnyPermission: () => false,
  }),
}));

vi.mock("@/services/laravelSchoolApi", () => ({
  laravelFinanceApi: {
    getStats: vi.fn().mockResolvedValue({
      totalPaid: 0,
      totalExpected: 0,
      totalRemaining: 0,
      totalExpenses: 0,
      totalSalaries: 0,
      netResult: 0,
      monthlyData: [],
      studentsUpToDate: 0,
      studentsNotUpToDate: 0,
    }),
  },
  laravelPaiementsApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  laravelExpensesApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  laravelFinanceSettingsApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/lib/pdfGenerator", () => ({
  generatePaymentReceipt: vi.fn(),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
}));

describe("Finances page", () => {
  it("shows empty states when there are no payments or expenses", async () => {
    render(<Finances />);

    expect(await screen.findByText("Aucun paiement enregistré")).toBeInTheDocument();
    expect(await screen.findByText("Aucune dépense enregistrée")).toBeInTheDocument();
  });
});
