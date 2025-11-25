import type { Event, Registration, ApiResponse, EventCreateInput, EventUpdateInput, RegistrationCreateInput, NotificationInput, NotificationResult } from "./types.js";
export declare class EventLiteClient {
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    private request;
    listEvents(options?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<Event[]>>;
    getEvent(idOrSlug: string): Promise<ApiResponse<Event>>;
    createEvent(input: EventCreateInput): Promise<ApiResponse<Event>>;
    updateEvent(idOrSlug: string, input: EventUpdateInput): Promise<ApiResponse<Event>>;
    deleteEvent(idOrSlug: string): Promise<{
        message: string;
    }>;
    listRegistrations(eventIdOrSlug: string, options?: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<Registration[]>>;
    getRegistration(eventIdOrSlug: string, email: string): Promise<ApiResponse<Registration>>;
    createRegistration(eventIdOrSlug: string, input: RegistrationCreateInput): Promise<ApiResponse<Registration>>;
    updateRegistration(eventIdOrSlug: string, email: string, input: {
        name?: string;
        notes?: string;
        status?: string;
    }): Promise<ApiResponse<Registration>>;
    deleteRegistration(eventIdOrSlug: string, email: string): Promise<{
        data: {
            message: string;
            promoted?: {
                email: string;
                name: string;
            };
        };
    }>;
    sendNotification(eventIdOrSlug: string, input: NotificationInput, preview?: boolean): Promise<ApiResponse<NotificationResult>>;
}
//# sourceMappingURL=client.d.ts.map