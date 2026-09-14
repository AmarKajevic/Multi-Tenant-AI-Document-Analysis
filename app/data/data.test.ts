import { describe, expect, it } from "vitest";
import { formatFileSize } from "./data";

describe("formatFileSize", () => {
  it("returns N/A for falsy input", () => {
    expect(formatFileSize(undefined)).toBe("N/A");
    expect(formatFileSize(0)).toBe("N/A");
  });

  it("formats bytes below 1KB as bytes", () => {
    expect(formatFileSize(512)).toBe("512 bytes");
  });

  it("formats sizes below 1MB as KB", () => {
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it("formats sizes at or above 1MB as MB", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
