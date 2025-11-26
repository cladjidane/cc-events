process.env.TZ = "UTC";

import { describe, expect, it, vi, afterEach } from "vitest";
import {
  cn,
  formatDate,
  formatDateRange,
  formatDateTime,
  formatRelativeDate,
  slugify,
} from "@/lib/utils";

afterEach(() => {
  vi.useRealTimers();
});

describe("utils", () => {
  it("combines class names with tailwind-merge", () => {
    expect(cn("px-2", "py-1", "px-4")).toBe("py-1 px-4");
  });

  it("formats dates in French", () => {
    const iso = "2025-02-01T18:30:00.000Z";
    expect(formatDate(iso)).toBe("1 février 2025");
    expect(formatDateTime(iso)).toBe("1 février 2025 à 18:30");
  });

  it("formats date ranges and handles same-day intervals", () => {
    const start = "2025-02-01T18:00:00.000Z";
    const end = "2025-02-01T20:00:00.000Z";
    expect(formatDateRange(start, end)).toBe(
      "1 février 2025 de 18:00 à 20:00"
    );

    const endNext = "2025-02-03T20:00:00.000Z";
    expect(formatDateRange(start, endNext)).toBe(
      "Du 1 février 2025 à 18:00 au 3 février 2025 à 20:00"
    );
  });

  it("returns relative dates using the current clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-10T12:00:00.000Z"));

    expect(formatRelativeDate("2025-02-08T12:00:00.000Z")).toBe("il y a 2 jours");
  });

  it("slugifies text by lowercasing, removing accents and non alphanumerics", () => {
    expect(slugify("Événement Génial 2025 !")).toBe("evenement-genial-2025");
    expect(slugify("  Hello---World  ")).toBe("hello-world");
  });
});
