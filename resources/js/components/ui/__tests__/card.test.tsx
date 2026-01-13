import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("applies density, variant, and tone data attributes", () => {
    render(
      <Card density="compact" variant="premium" tone="success">
        <div>content</div>
      </Card>
    );

    const card = screen.getByText("content").closest(".ui-card");
    if (!card) {
      throw new Error("Expected card wrapper to be present.");
    }
    expect(card).toHaveAttribute("data-density", "compact");
    expect(card).toHaveAttribute("data-variant", "premium");
    expect(card).toHaveAttribute("data-tone", "success");
  });
});
