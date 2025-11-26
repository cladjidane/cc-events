import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Ensure isolation per run
const TEST_DB_PATH = path.join(process.cwd(), "tmp", "test.db");
const SCHEMA_PATH = path.join(process.cwd(), "prisma", "schema.test.prisma");

let PrismaClient: typeof import("../../node_modules/.prisma/test-client").PrismaClient;
let prisma: import("../../node_modules/.prisma/test-client").PrismaClient;

// Generate client and push schema once before all tests
beforeAll(async () => {
  fs.mkdirSync(path.dirname(TEST_DB_PATH), { recursive: true });
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.rmSync(TEST_DB_PATH);
  }
  process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

  execSync(`npx prisma db push --schema ${SCHEMA_PATH} --skip-generate`, {
    stdio: "inherit",
  });
  execSync(`npx prisma generate --schema ${SCHEMA_PATH}`, { stdio: "inherit" });

  // Import generated client after generation
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PrismaClient = require("../../node_modules/.prisma/test-client").PrismaClient;
  prisma = new PrismaClient();
});

beforeEach(async () => {
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
});

describe("Prisma integration (SQLite)", () => {
  it("creates an organizer, event, and registration", async () => {
    const organizer = await prisma.user.create({
      data: {
        email: "organizer@example.com",
        password: "hashed",
        name: "Org",
      },
    });

    const event = await prisma.event.create({
      data: {
        slug: "my-event",
        organizerId: organizer.id,
        title: "My Event",
        mode: "ONLINE",
        location: "https://meet.example.com",
        startAt: new Date("2025-02-01T18:00:00.000Z"),
        endAt: new Date("2025-02-01T20:00:00.000Z"),
        timezone: "UTC",
        status: "PUBLISHED",
      },
    });

    const registration = await prisma.registration.create({
      data: {
        eventId: event.id,
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Doe",
        status: "CONFIRMED",
      },
    });

    const fetched = await prisma.event.findUnique({
      where: { id: event.id },
      include: { registrations: true },
    });

    expect(fetched?.registrations).toHaveLength(1);
    expect(fetched?.registrations[0].email).toBe(registration.email);
  });

  it("enforces unique registration per event/email", async () => {
    const user = await prisma.user.create({
      data: { email: "u@example.com", password: "hashed", name: "U" },
    });
    const event = await prisma.event.create({
      data: {
        slug: "dup-event",
        organizerId: user.id,
        title: "Dup",
        mode: "ONLINE",
        startAt: new Date("2025-02-01T18:00:00.000Z"),
        endAt: new Date("2025-02-01T20:00:00.000Z"),
        timezone: "UTC",
        status: "PUBLISHED",
      },
    });

    await prisma.registration.create({
      data: {
        eventId: event.id,
        email: "dup@example.com",
        firstName: "Dup",
        lastName: "Test",
      },
    });

    await expect(
      prisma.registration.create({
        data: {
          eventId: event.id,
          email: "dup@example.com",
          firstName: "Another",
          lastName: "User",
        },
      })
    ).rejects.toThrow();
  });
});
