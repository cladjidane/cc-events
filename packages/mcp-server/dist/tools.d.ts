import { z } from "zod";
export declare const tools: readonly [{
    readonly name: "list_events";
    readonly description: "List all events. Can filter by status (DRAFT, PUBLISHED, CLOSED, CANCELLED). Returns event details including registration counts.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly status: {
                readonly type: "string";
                readonly enum: readonly ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"];
                readonly description: "Filter events by status";
            };
            readonly limit: {
                readonly type: "number";
                readonly description: "Maximum number of events to return (default: 50, max: 100)";
            };
        };
    };
}, {
    readonly name: "get_event";
    readonly description: "Get details of a specific event by its ID or slug. Returns full event information including registration counts.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
                readonly description: "Event ID (UUID) or slug";
            };
        };
        readonly required: readonly ["id"];
    };
}, {
    readonly name: "create_event";
    readonly description: "Create a new event. Required fields: title, mode (ONLINE or IN_PERSON), startAt. The event is created as DRAFT by default.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly title: {
                readonly type: "string";
                readonly description: "Event title (3-100 characters)";
            };
            readonly subtitle: {
                readonly type: "string";
                readonly description: "Optional subtitle";
            };
            readonly description: {
                readonly type: "string";
                readonly description: "Event description (supports markdown)";
            };
            readonly mode: {
                readonly type: "string";
                readonly enum: readonly ["ONLINE", "IN_PERSON"];
                readonly description: "Event mode";
            };
            readonly location: {
                readonly type: "string";
                readonly description: "Address for in-person events, or video call link for online events";
            };
            readonly startAt: {
                readonly type: "string";
                readonly description: "Start date/time in ISO 8601 format (e.g., 2025-02-15T19:00:00.000Z)";
            };
            readonly endAt: {
                readonly type: "string";
                readonly description: "End date/time (optional, defaults to startAt + 2 hours)";
            };
            readonly capacity: {
                readonly type: "number";
                readonly description: "Maximum number of participants (optional, null = unlimited)";
            };
            readonly waitlist: {
                readonly type: "boolean";
                readonly description: "Enable waitlist when full (default: true)";
            };
            readonly status: {
                readonly type: "string";
                readonly enum: readonly ["DRAFT", "PUBLISHED"];
                readonly description: "Initial status (default: DRAFT)";
            };
        };
        readonly required: readonly ["title", "mode", "startAt"];
    };
}, {
    readonly name: "update_event";
    readonly description: "Update an existing event. Only provided fields will be updated. Use status to publish or cancel events.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
                readonly description: "Event ID or slug";
            };
            readonly title: {
                readonly type: "string";
            };
            readonly subtitle: {
                readonly type: "string";
            };
            readonly description: {
                readonly type: "string";
            };
            readonly mode: {
                readonly type: "string";
                readonly enum: readonly ["ONLINE", "IN_PERSON"];
            };
            readonly location: {
                readonly type: "string";
            };
            readonly startAt: {
                readonly type: "string";
            };
            readonly endAt: {
                readonly type: "string";
            };
            readonly capacity: {
                readonly type: "number";
            };
            readonly waitlist: {
                readonly type: "boolean";
            };
            readonly status: {
                readonly type: "string";
                readonly enum: readonly ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"];
            };
        };
        readonly required: readonly ["id"];
    };
}, {
    readonly name: "delete_event";
    readonly description: "Delete an event permanently. This also deletes all registrations. Use with caution.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
                readonly description: "Event ID or slug";
            };
        };
        readonly required: readonly ["id"];
    };
}, {
    readonly name: "list_registrations";
    readonly description: "List all registrations for an event. Can filter by status (CONFIRMED, WAITLIST, CANCELLED).";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly eventId: {
                readonly type: "string";
                readonly description: "Event ID or slug";
            };
            readonly status: {
                readonly type: "string";
                readonly enum: readonly ["CONFIRMED", "WAITLIST", "CANCELLED"];
                readonly description: "Filter by registration status";
            };
            readonly limit: {
                readonly type: "number";
                readonly description: "Maximum number of registrations to return";
            };
        };
        readonly required: readonly ["eventId"];
    };
}, {
    readonly name: "register_attendee";
    readonly description: "Register a new attendee to an event. If the event is full and has waitlist enabled, the attendee will be added to waitlist.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly eventId: {
                readonly type: "string";
                readonly description: "Event ID or slug";
            };
            readonly email: {
                readonly type: "string";
                readonly description: "Attendee email address";
            };
            readonly name: {
                readonly type: "string";
                readonly description: "Attendee full name";
            };
            readonly notes: {
                readonly type: "string";
                readonly description: "Optional notes (e.g., dietary requirements)";
            };
        };
        readonly required: readonly ["eventId", "email", "name"];
    };
}, {
    readonly name: "unregister_attendee";
    readonly description: "Cancel a registration. If the attendee was confirmed and there's a waitlist, the first person on waitlist will be promoted.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly eventId: {
                readonly type: "string";
                readonly description: "Event ID or slug";
            };
            readonly email: {
                readonly type: "string";
                readonly description: "Attendee email to unregister";
            };
        };
        readonly required: readonly ["eventId", "email"];
    };
}, {
    readonly name: "send_notification";
    readonly description: "Send an email notification to event attendees. Can target all, confirmed only, or waitlist only.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly eventId: {
                readonly type: "string";
                readonly description: "Event ID or slug";
            };
            readonly subject: {
                readonly type: "string";
                readonly description: "Email subject line";
            };
            readonly message: {
                readonly type: "string";
                readonly description: "Email message body (supports line breaks with \\n)";
            };
            readonly target: {
                readonly type: "string";
                readonly enum: readonly ["all", "confirmed", "waitlist"];
                readonly description: "Who to send to (default: all)";
            };
            readonly includeEventDetails: {
                readonly type: "boolean";
                readonly description: "Include event details in the email (default: true)";
            };
            readonly preview: {
                readonly type: "boolean";
                readonly description: "Preview mode - don't actually send (default: false)";
            };
        };
        readonly required: readonly ["eventId", "subject", "message"];
    };
}];
export declare const listEventsSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" | undefined;
    limit?: number | undefined;
}, {
    status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" | undefined;
    limit?: number | undefined;
}>;
export declare const getEventSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const createEventSchema: z.ZodObject<{
    title: z.ZodString;
    subtitle: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    mode: z.ZodEnum<["ONLINE", "IN_PERSON"]>;
    location: z.ZodOptional<z.ZodString>;
    startAt: z.ZodString;
    endAt: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodNumber>;
    waitlist: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    mode: "ONLINE" | "IN_PERSON";
    startAt: string;
    waitlist?: boolean | undefined;
    status?: "DRAFT" | "PUBLISHED" | undefined;
    subtitle?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    endAt?: string | undefined;
    capacity?: number | undefined;
}, {
    title: string;
    mode: "ONLINE" | "IN_PERSON";
    startAt: string;
    waitlist?: boolean | undefined;
    status?: "DRAFT" | "PUBLISHED" | undefined;
    subtitle?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    endAt?: string | undefined;
    capacity?: number | undefined;
}>;
export declare const updateEventSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodEnum<["ONLINE", "IN_PERSON"]>>;
    location: z.ZodOptional<z.ZodString>;
    startAt: z.ZodOptional<z.ZodString>;
    endAt: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodNumber>;
    waitlist: z.ZodOptional<z.ZodBoolean>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    waitlist?: boolean | undefined;
    status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" | undefined;
    title?: string | undefined;
    mode?: "ONLINE" | "IN_PERSON" | undefined;
    startAt?: string | undefined;
    subtitle?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    endAt?: string | undefined;
    capacity?: number | undefined;
}, {
    id: string;
    waitlist?: boolean | undefined;
    status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" | undefined;
    title?: string | undefined;
    mode?: "ONLINE" | "IN_PERSON" | undefined;
    startAt?: string | undefined;
    subtitle?: string | undefined;
    description?: string | undefined;
    location?: string | undefined;
    endAt?: string | undefined;
    capacity?: number | undefined;
}>;
export declare const deleteEventSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const listRegistrationsSchema: z.ZodObject<{
    eventId: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["CONFIRMED", "WAITLIST", "CANCELLED"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    eventId: string;
    status?: "CANCELLED" | "CONFIRMED" | "WAITLIST" | undefined;
    limit?: number | undefined;
}, {
    eventId: string;
    status?: "CANCELLED" | "CONFIRMED" | "WAITLIST" | undefined;
    limit?: number | undefined;
}>;
export declare const registerAttendeeSchema: z.ZodObject<{
    eventId: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    eventId: string;
    email: string;
    name: string;
    notes?: string | undefined;
}, {
    eventId: string;
    email: string;
    name: string;
    notes?: string | undefined;
}>;
export declare const unregisterAttendeeSchema: z.ZodObject<{
    eventId: z.ZodString;
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    eventId: string;
    email: string;
}, {
    eventId: string;
    email: string;
}>;
export declare const sendNotificationSchema: z.ZodObject<{
    eventId: z.ZodString;
    subject: z.ZodString;
    message: z.ZodString;
    target: z.ZodOptional<z.ZodEnum<["all", "confirmed", "waitlist"]>>;
    includeEventDetails: z.ZodOptional<z.ZodBoolean>;
    preview: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    eventId: string;
    subject: string;
    message: string;
    target?: "all" | "confirmed" | "waitlist" | undefined;
    includeEventDetails?: boolean | undefined;
    preview?: boolean | undefined;
}, {
    eventId: string;
    subject: string;
    message: string;
    target?: "all" | "confirmed" | "waitlist" | undefined;
    includeEventDetails?: boolean | undefined;
    preview?: boolean | undefined;
}>;
//# sourceMappingURL=tools.d.ts.map