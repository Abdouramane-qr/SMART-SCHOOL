import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { StudentDetailsModal } from "@/components/students/StudentDetailsModal";

const getById = vi.fn();

vi.mock("@/services/laravelSchoolApi", () => ({
  laravelStudentsApi: {
    getById: (...args: any[]) => getById(...args),
  },
  normalizeStudentClasse: (student: any) => student.classe?.name || null,
  normalizeStudentName: (student: any) => student.full_name || "",
  normalizeStudentPayments: (student: any) => ({
    totalDue: student.total_due ?? 0,
    totalPaid: student.total_paid ?? 0,
    payments: student.paiements || [],
  }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

describe("StudentDetailsModal", () => {
  it("renders student details when the API succeeds", async () => {
    getById.mockResolvedValueOnce({
      id: 1,
      student_id: "S-200",
      full_name: "Alice Doe",
      birth_date: "2012-02-02",
      gender: "F",
      address: "Rue 123",
      parent_name: "Parent Doe",
      parent_phone: "+221111",
      parent_email: "parent@example.com",
      classe: { name: "6A" },
      paiements: [],
      total_due: 0,
      total_paid: 0,
    });

    render(
      <StudentDetailsModal
        student={{ id: "1", full_name: "Alice Doe", student_id: "S-200", class_name: "6A" }}
        isOpen
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Doe")).toBeInTheDocument();
    });

    expect(screen.getByText("S-200")).toBeInTheDocument();
    expect(screen.getByText("Rue 123")).toBeInTheDocument();
    expect(screen.getByText("parent@example.com")).toBeInTheDocument();
  });
});
