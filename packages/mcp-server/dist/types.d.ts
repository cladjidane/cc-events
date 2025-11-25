export interface Event {
    id: string;
    slug: string;
    title: string;
    subtitle?: string;
    description?: string;
    coverImage?: string;
    mode: "ONLINE" | "IN_PERSON";
    location?: string;
    latitude?: number;
    longitude?: number;
    startAt: string;
    endAt: string;
    timezone: string;
    capacity?: number;
    waitlist: boolean;
    status: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED";
    organizerId: string;
    createdAt: string;
    updatedAt: string;
    confirmed_count?: number;
    waitlist_count?: number;
    total_registrations?: number;
}
export interface Registration {
    id: string;
    email: string;
    name: string;
    first_name: string;
    last_name: string;
    notes?: string;
    status: "CONFIRMED" | "WAITLIST" | "CANCELLED";
    registered_at: string;
    updated_at: string;
    event?: {
        id: string;
        title: string;
        slug: string;
    };
}
export interface Pagination {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
}
export interface ApiResponse<T> {
    data: T;
    pagination?: Pagination;
}
export interface ApiError {
    error: string;
}
export interface EventCreateInput {
    title: string;
    subtitle?: string;
    description?: string;
    coverImage?: string;
    mode: "ONLINE" | "IN_PERSON";
    location?: string;
    latitude?: number;
    longitude?: number;
    startAt: string;
    endAt?: string;
    capacity?: number;
    waitlist?: boolean;
    status?: "DRAFT" | "PUBLISHED";
}
export interface EventUpdateInput {
    title?: string;
    subtitle?: string;
    description?: string;
    coverImage?: string;
    mode?: "ONLINE" | "IN_PERSON";
    location?: string;
    latitude?: number;
    longitude?: number;
    startAt?: string;
    endAt?: string;
    capacity?: number;
    waitlist?: boolean;
    status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED";
}
export interface RegistrationCreateInput {
    email: string;
    name: string;
    notes?: string;
}
export interface NotificationInput {
    subject: string;
    message: string;
    target?: "all" | "confirmed" | "waitlist";
    includeEventDetails?: boolean;
}
export interface NotificationResult {
    sent: number;
    failed: number;
    target: string;
    total: number;
    details: Array<{
        email: string;
        status: "sent" | "failed";
        error?: string;
    }>;
}
export interface Stats {
    events: {
        total: number;
        byStatus: {
            draft: number;
            published: number;
            closed: number;
            cancelled: number;
        };
    };
    registrations: {
        total: number;
        byStatus: {
            confirmed: number;
            waitlist: number;
        };
    };
    upcoming: Array<{
        id: string;
        title: string;
        slug: string;
        startAt: string;
        confirmed: number;
        capacity?: number;
    }>;
}
//# sourceMappingURL=types.d.ts.map