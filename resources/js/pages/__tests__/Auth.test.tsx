import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Auth from "@/pages/Auth";

vi.mock("@/services/laravelAuthApi", () => ({
  laravelAuthApi: {
    me: vi.fn().mockResolvedValue(null),
    login: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    refreshSession: vi.fn(),
  }),
}));

describe("Auth page", () => {
  it("shows the Filament access notice", () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        "Accès admin uniquement via Filament. Tous les autres rôles utilisent cette interface."
      )
    ).toBeInTheDocument();
  });
});
