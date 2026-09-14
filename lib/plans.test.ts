import { describe, expect, it } from "vitest";
import { getPlanLimits, PLAN_LIMITS } from "./plans";

describe("getPlanLimits", () => {
  it("returns the free plan's limits", () => {
    expect(getPlanLimits("free")).toBe(PLAN_LIMITS.free);
  });

  it("falls back to free for an unknown or missing plan tier", () => {
    expect(getPlanLimits("nonexistent-plan")).toBe(PLAN_LIMITS.free);
    expect(getPlanLimits("")).toBe(PLAN_LIMITS.free);
  });
});
