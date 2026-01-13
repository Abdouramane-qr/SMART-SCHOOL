import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { StudentAuditModal } from "@/components/students/StudentAuditModal";

const getByStudentId = vi.fn();

vi.mock("@/services/laravelSchoolApi", () => ({
  laravelStudentAuditsApi: {
    getByStudentId: (...args: any[]) => getByStudentId(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

describe("StudentAuditModal", () => {
  it("shows a fallback message when the audit API fails", async () => {
    getByStudentId.mockRejectedValueOnce(new Error("404"));

    render(
      <StudentAuditModal
        studentId="245"
        studentName="Test Student"
        isOpen
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Historique indisponible pour le moment.")).toBeInTheDocument();
    });
  });
});
