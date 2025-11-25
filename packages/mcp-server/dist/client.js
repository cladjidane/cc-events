export class EventLiteClient {
    baseUrl;
    apiKey;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.apiKey = apiKey;
    }
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = (await response.json());
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        return data;
    }
    // ==================== EVENTS ====================
    async listEvents(options) {
        const params = new URLSearchParams();
        if (options?.status)
            params.set("status", options.status);
        if (options?.limit)
            params.set("limit", options.limit.toString());
        if (options?.offset)
            params.set("offset", options.offset.toString());
        const query = params.toString();
        return this.request("GET", `/api/v1/events${query ? `?${query}` : ""}`);
    }
    async getEvent(idOrSlug) {
        return this.request("GET", `/api/v1/events/${encodeURIComponent(idOrSlug)}`);
    }
    async createEvent(input) {
        return this.request("POST", "/api/v1/events", input);
    }
    async updateEvent(idOrSlug, input) {
        return this.request("PATCH", `/api/v1/events/${encodeURIComponent(idOrSlug)}`, input);
    }
    async deleteEvent(idOrSlug) {
        return this.request("DELETE", `/api/v1/events/${encodeURIComponent(idOrSlug)}`);
    }
    // ==================== REGISTRATIONS ====================
    async listRegistrations(eventIdOrSlug, options) {
        const params = new URLSearchParams();
        if (options?.status)
            params.set("status", options.status);
        if (options?.limit)
            params.set("limit", options.limit.toString());
        if (options?.offset)
            params.set("offset", options.offset.toString());
        const query = params.toString();
        return this.request("GET", `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/registrations${query ? `?${query}` : ""}`);
    }
    async getRegistration(eventIdOrSlug, email) {
        return this.request("GET", `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/registrations/${encodeURIComponent(email)}`);
    }
    async createRegistration(eventIdOrSlug, input) {
        return this.request("POST", `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/registrations`, input);
    }
    async updateRegistration(eventIdOrSlug, email, input) {
        return this.request("PATCH", `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/registrations/${encodeURIComponent(email)}`, input);
    }
    async deleteRegistration(eventIdOrSlug, email) {
        return this.request("DELETE", `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/registrations/${encodeURIComponent(email)}`);
    }
    // ==================== NOTIFICATIONS ====================
    async sendNotification(eventIdOrSlug, input, preview = false) {
        const query = preview ? "?preview=true" : "";
        return this.request("POST", `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/notify${query}`, input);
    }
}
//# sourceMappingURL=client.js.map