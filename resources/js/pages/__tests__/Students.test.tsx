import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Students from "@/pages/Students";
import { useQuery } from "@tanstack/react-query";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/components/RoleGuard", () => ({
  RoleGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ImportExportActions", () => ({
  ImportExportActions: () => <div data-testid="import-export-actions" />,
}));

vi.mock("@/components/ui/ActionTooltip", () => ({
  ActionTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/students/AddStudentDialog", () => ({
  AddStudentDialog: () => null,
}));
vi.mock("@/components/students/StudentDetailsModal", () => ({
  StudentDetailsModal: () => null,
}));
vi.mock("@/components/students/NewPaymentDialog", () => ({
  NewPaymentDialog: () => null,
}));
vi.mock("@/components/students/EditStudentDialog", () => ({
  EditStudentDialog: () => null,
}));
vi.mock("@/components/students/DeleteStudentDialog", () => ({
  DeleteStudentDialog: () => null,
}));
vi.mock("@/components/students/StudentAuditModal", () => ({
  StudentAuditModal: () => null,
}));

const mockUseQuery = vi.mocked(useQuery);

describe("Students page", () => {
  it("renders the empty state when there are no students", () => {
    mockUseQuery.mockImplementation(({ queryKey }: any) => {
      const key = Array.isArray(queryKey) ? queryKey[1] : queryKey;

      if (key === "classes") {
        return { data: [], isLoading: false, isError: false };
      }

      if (key === "students") {
        return {
          data: { items: [], meta: { total: 0 } },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        };
      }

      if (key === "finance-stats") {
        return { data: { studentsUpToDate: 0, studentsNotUpToDate: 0 }, isLoading: false, isError: false };
      }

      if (key === "finance-settings") {
        return { data: [], isLoading: false, isError: false };
      }

      return { data: null, isLoading: false, isError: false };
    });

    render(<Students />);

    expect(screen.getByText("Aucun élève trouvé")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ajouter un élève/i })).toBeInTheDocument();
  });
});
