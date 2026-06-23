import { describe, expect, it } from "vitest";
import { calculateQuote, defaultForm, quoteToText } from "./quoteEngine";

const buildForm = (changes = {}) => ({ ...defaultForm, ...changes, addOnIds: [], customAddOns: [] });

describe("smart quote calculation engine", () => {
  it("creates a profitable recommended quote", () => {
    const quote = calculateQuote(buildForm());
    expect(quote.recommendedPrice).toBeGreaterThan(quote.totalCost);
    expect(quote.actualMargin).toBeGreaterThan(0);
    expect(quote.totalHours).toBeGreaterThan(0);
  });

  it("adds cost when complex scope and add-ons are selected", () => {
    const base = calculateQuote(buildForm({ complexity: "simple", features: 4 }));
    const expanded = calculateQuote(buildForm({ complexity: "enterprise", features: 12, addOnIds: ["chatbot", "payments"] }));
    expect(expanded.recommendedPrice).toBeGreaterThan(base.recommendedPrice);
    expect(expanded.totalHours).toBeGreaterThan(base.totalHours);
  });

  it("recommends negotiation when budget is below quote but above margin floor", () => {
    const baseline = calculateQuote(buildForm());
    const quote = calculateQuote(buildForm({ clientBudget: Math.round((baseline.recommendedPrice + baseline.marginFloor) / 2) }));
    expect(quote.decision.kind).toBe("Negotiate");
  });

  it("creates an exportable text summary", () => {
    const form = buildForm({ client: "Jane Smith", company: "Acme", quoteName: "Website refresh" });
    const text = quoteToText(form, calculateQuote(form));
    expect(text).toContain("ELITE ERA DEVELOPMENT L.L.C");
    expect(text).toContain("Jane Smith");
    expect(text).toContain("Website refresh");
  });
});
