import { z } from "zod";

// ==================== TOOL DEFINITIONS ====================

export const tools = [
  // Events
  {
    name: "list_events",
    description:
      "List all events. Can filter by status (DRAFT, PUBLISHED, CLOSED, CANCELLED). Returns event details including registration counts.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"],
          description: "Filter events by status",
        },
        limit: {
          type: "number",
          description: "Maximum number of events to return (default: 50, max: 100)",
        },
      },
    },
  },
  {
    name: "get_event",
    description:
      "Get details of a specific event by its ID or slug. Returns full event information including registration counts.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Event ID (UUID) or slug",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_event",
    description:
      "Create a new event. Required fields: title, mode (ONLINE or IN_PERSON), startAt. The event is created as DRAFT by default.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Event title (3-100 characters)",
        },
        subtitle: {
          type: "string",
          description: "Optional subtitle",
        },
        description: {
          type: "string",
          description: "Event description (supports markdown)",
        },
        mode: {
          type: "string",
          enum: ["ONLINE", "IN_PERSON"],
          description: "Event mode",
        },
        location: {
          type: "string",
          description: "Address for in-person events, or video call link for online events",
        },
        startAt: {
          type: "string",
          description: "Start date/time in ISO 8601 format (e.g., 2025-02-15T19:00:00.000Z)",
        },
        endAt: {
          type: "string",
          description: "End date/time (optional, defaults to startAt + 2 hours)",
        },
        capacity: {
          type: "number",
          description: "Maximum number of participants (optional, null = unlimited)",
        },
        waitlist: {
          type: "boolean",
          description: "Enable waitlist when full (default: true)",
        },
        status: {
          type: "string",
          enum: ["DRAFT", "PUBLISHED"],
          description: "Initial status (default: DRAFT)",
        },
      },
      required: ["title", "mode", "startAt"],
    },
  },
  {
    name: "update_event",
    description:
      "Update an existing event. Only provided fields will be updated. Use status to publish or cancel events.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Event ID or slug",
        },
        title: { type: "string" },
        subtitle: { type: "string" },
        description: { type: "string" },
        mode: { type: "string", enum: ["ONLINE", "IN_PERSON"] },
        location: { type: "string" },
        startAt: { type: "string" },
        endAt: { type: "string" },
        capacity: { type: "number" },
        waitlist: { type: "boolean" },
        status: {
          type: "string",
          enum: ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"],
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_event",
    description:
      "Delete an event permanently. This also deletes all registrations. Use with caution.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Event ID or slug",
        },
      },
      required: ["id"],
    },
  },

  // Registrations
  {
    name: "list_registrations",
    description:
      "List all registrations for an event. Can filter by status (CONFIRMED, WAITLIST, CANCELLED).",
    inputSchema: {
      type: "object" as const,
      properties: {
        eventId: {
          type: "string",
          description: "Event ID or slug",
        },
        status: {
          type: "string",
          enum: ["CONFIRMED", "WAITLIST", "CANCELLED"],
          description: "Filter by registration status",
        },
        limit: {
          type: "number",
          description: "Maximum number of registrations to return",
        },
      },
      required: ["eventId"],
    },
  },
  {
    name: "register_attendee",
    description:
      "Register a new attendee to an event. If the event is full and has waitlist enabled, the attendee will be added to waitlist.",
    inputSchema: {
      type: "object" as const,
      properties: {
        eventId: {
          type: "string",
          description: "Event ID or slug",
        },
        email: {
          type: "string",
          description: "Attendee email address",
        },
        name: {
          type: "string",
          description: "Attendee full name",
        },
        notes: {
          type: "string",
          description: "Optional notes (e.g., dietary requirements)",
        },
      },
      required: ["eventId", "email", "name"],
    },
  },
  {
    name: "unregister_attendee",
    description:
      "Cancel a registration. If the attendee was confirmed and there's a waitlist, the first person on waitlist will be promoted.",
    inputSchema: {
      type: "object" as const,
      properties: {
        eventId: {
          type: "string",
          description: "Event ID or slug",
        },
        email: {
          type: "string",
          description: "Attendee email to unregister",
        },
      },
      required: ["eventId", "email"],
    },
  },

  // Notifications
  {
    name: "send_notification",
    description:
      "Send an email notification to event attendees. Can target all, confirmed only, or waitlist only.",
    inputSchema: {
      type: "object" as const,
      properties: {
        eventId: {
          type: "string",
          description: "Event ID or slug",
        },
        subject: {
          type: "string",
          description: "Email subject line",
        },
        message: {
          type: "string",
          description: "Email message body (supports line breaks with \\n)",
        },
        target: {
          type: "string",
          enum: ["all", "confirmed", "waitlist"],
          description: "Who to send to (default: all)",
        },
        includeEventDetails: {
          type: "boolean",
          description: "Include event details in the email (default: true)",
        },
        preview: {
          type: "boolean",
          description: "Preview mode - don't actually send (default: false)",
        },
      },
      required: ["eventId", "subject", "message"],
    },
  },
] as const;

// ==================== INPUT VALIDATION SCHEMAS ====================

export const listEventsSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"]).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const getEventSchema = z.object({
  id: z.string().min(1),
});

export const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  mode: z.enum(["ONLINE", "IN_PERSON"]),
  location: z.string().optional(),
  startAt: z.string(),
  endAt: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  waitlist: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const updateEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).max(100).optional(),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  mode: z.enum(["ONLINE", "IN_PERSON"]).optional(),
  location: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  waitlist: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"]).optional(),
});

export const deleteEventSchema = z.object({
  id: z.string().min(1),
});

export const listRegistrationsSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(["CONFIRMED", "WAITLIST", "CANCELLED"]).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const registerAttendeeSchema = z.object({
  eventId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
});

export const unregisterAttendeeSchema = z.object({
  eventId: z.string().min(1),
  email: z.string().email(),
});

export const sendNotificationSchema = z.object({
  eventId: z.string().min(1),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  target: z.enum(["all", "confirmed", "waitlist"]).optional(),
  includeEventDetails: z.boolean().optional(),
  preview: z.boolean().optional(),
});
