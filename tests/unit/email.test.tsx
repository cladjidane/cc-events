import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(async () => ({ messageId: "smtp-123" })),
      verify: vi.fn(),
    })),
  },
}));

vi.mock("resend", () => {
  return {
    Resend: vi.fn(() => ({
      emails: {
        send: vi.fn(async () => ({ data: { id: "resend-123" } })),
      },
    })),
  };
});

// Import after mocks
import { sendEmail } from "@/lib/email";

describe("sendEmail", () => {
  const react = <div>hello</div>;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fails when no transport is configured", async () => {
    process.env.SMTP_HOST = "";
    process.env.SMTP_USER = "";
    process.env.SMTP_PASSWORD = "";
    process.env.RESEND_API_KEY = "";

    const result = await sendEmail({ to: "a@test.com", subject: "Hello", react });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
