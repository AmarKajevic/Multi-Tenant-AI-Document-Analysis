import { describe, expect, it } from "vitest";
import { toStat } from "./usage-math";

describe("toStat", () => {
  it("reports remaining quota when under the limit", () => {
    expect(toStat(12, 20)).toEqual({
      used: 12,
      limit: 20,
      remaining: 8,
      exceeded: false,
    });
  });

  it("flags exceeded exactly at the limit", () => {
    const stat = toStat(20, 20);
    expect(stat.exceeded).toBe(true);
    expect(stat.remaining).toBe(0);
  });

  it("never reports negative remaining when over the limit", () => {
    const stat = toStat(35, 20);
    expect(stat.exceeded).toBe(true);
    expect(stat.remaining).toBe(0);
  });

  it("treats zero usage as not exceeded", () => {
    expect(toStat(0, 20).exceeded).toBe(false);
  });
});
