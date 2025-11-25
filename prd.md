# PROJECT SPECIFICATION: EventLite

## 1. PROJECT IDENTITY
**Role:** Senior Fullstack Developer Expert
**Goal:** Build "EventLite", a minimalist event management platform (API-first architecture, server-side logic).
**Constraint:** Strict adherence to Next.js 15 Stable patterns.

## 2. TECH STACK (STRICT)
- **Framework:** Next.js 15 (App Router).
- **Language:** TypeScript (Strict mode).
- **Core:** React 19 (RC/Stable).
- **Database:** PostgreSQL.
- **ORM:** Prisma.
- **Styling:** Tailwind CSS + Shadcn/UI (Lucide Icons).
- **Data Mutation:** Server Actions (`'use server'`) ONLY. No API Routes for internal UI.
- **State Management:** `useActionState` (React 19) for forms, `useOptimistic` for UI feedback.
- **Validation:** Zod.
- **Email:** Resend API + React-Email.
- **Date Handling:** `date-fns` (Store in UTC, Display in Local).

## 3. DATABASE SCHEMA (PRISMA)
*Copy strictly this schema:*

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "sqlite" for local dev
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  ORGANIZER
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CLOSED
  CANCELLED
}

enum EventMode {
  ONLINE
  IN_PERSON
}

enum RegistrationStatus {
  CONFIRMED
  WAITLIST
  CANCELLED
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(ORGANIZER)
  events    Event[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Event {
  id          String      @id @default(uuid())
  slug        String      @unique
  organizerId String
  organizer   User        @relation(fields: [organizerId], references: [id])
  
  title       String
  subtitle    String?
  description String?     @db.Text
  coverImage  String?
  
  mode        EventMode
  location    String?     // URL or Address
  
  startAt     DateTime    // UTC
  endAt       DateTime    // UTC
  timezone    String      // e.g., "Europe/Paris"
  
  capacity    Int?        // Null = Unlimited
  waitlist    Boolean     @default(false)
  
  status      EventStatus @default(DRAFT)
  
  registrations Registration[]
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Registration {
  id          String             @id @default(uuid())
  eventId     String
  event       Event              @relation(fields: [eventId], references: [id])
  
  email       String
  firstName   String
  lastName    String
  notes       String?
  
  status      RegistrationStatus @default(CONFIRMED)
  cancelToken String             @unique @default(uuid())
  
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@unique([email, eventId])
}
````

## 4\. ARCHITECTURE & FOLDER STRUCTURE

```
/app
  /(public)           # Public layout
    /page.tsx         # Landing
    /e/[slug]/        # Event Page
  /(admin)            # Protected layout
    /dashboard/       # Admin Dashboard
  /api/v1/            # EXTERNAL API ONLY (Webhooks/Scripts)
/actions              # SERVER ACTIONS (Internal API)
  register.ts         # Logic for registration
  admin-events.ts     # CRUD logic
/components           # Shadcn components
/lib
  db.ts               # Prisma singleton
  utils.ts
```

## 5\. BUSINESS RULES (LOGIC)

### A. Registration Logic (Server Action)

**File:** `actions/register.ts`

1.  **Input:** FormData + EventID.
2.  **Validation:** Validate with Zod.
3.  **Concurrency Safety:** Use Prisma Transaction (`$transaction`).
4.  **Steps:**
      * Check if user already registered (Unique constraint).
      * Count current `CONFIRMED` registrations.
      * **IF** `count < capacity`: Status = `CONFIRMED`.
      * **ELSE IF** `waitlist === true`: Status = `WAITLIST`.
      * **ELSE**: Throw Error "Event Full".
5.  **Post-Action:** Revalidate path `/e/[slug]`. Send Email async.

### B. Admin Dashboard

1.  Use `useOptimistic` for deleting/updating registrations to make UI snappy.
2.  Dates must be input in Local Time but converted to UTC before saving to DB.

### C. Security

1.  Admin routes must be protected (Middleware or Layout check).
2.  Registration cancellation uses `cancelToken` (UUID), never the ID.

## 6\. DEVELOPMENT PHASES (FOLLOW THIS ORDER)

**Phase 1: Foundation**

  - Initialize Next.js 15 project.
  - Setup Shadcn/UI (Button, Input, Card, Table, Form).
  - Setup Prisma & Seed script (Create 1 Admin, 2 Events).

**Phase 2: Public Interface**

  - Build `/e/[slug]` page (SSR).
  - Implement `RegistrationForm` component with `useActionState`.
  - Implement `actions/register.ts` with logic described above.

**Phase 3: Admin & Dashboard**

  - Build Event List & Create/Edit Form.
  - Build Registration List (DataTable).

**Phase 4: Email & Automation**

  - Setup Resend.
  - Create `email-confirmation.tsx` template.
  - Implement ICS generation.

## 7\. CODING STANDARDS

  - **Do NOT** use `useEffect` for data fetching. Use Server Components.
  - **Do NOT** use API Routes (`/app/api`) for the frontend. Use Server Actions.
  - **Do** use `zod` for all inputs.
  - **Do** handle errors gracefully in Server Actions (return `{error: string, success: boolean}`).

