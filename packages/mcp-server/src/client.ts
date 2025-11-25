import type {
  Event,
  Registration,
  ApiResponse,
  EventCreateInput,
  EventUpdateInput,
  RegistrationCreateInput,
  NotificationInput,
  NotificationResult,
} from "./types.js";

export class EventLiteClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json()) as T & { error?: string };

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data as T;
  }

  // ==================== EVENTS ====================

  async listEvents(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Event[]>> {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());

    const query = params.toString();
    return this.request("GET", `/api/v1/events${query ? `?${query}` : ""}`);
  }

  async getEvent(idOrSlug: string): Promise<ApiResponse<Event>> {
    return this.request("GET", `/api/v1/events/${encodeURIComponent(idOrSlug)}`);
  }

  async createEvent(input: EventCreateInput): Promise<ApiResponse<Event>> {
    return this.request("POST", "/api/v1/events", input);
  }

  async updateEvent(
    idOrSlug: string,
    input: EventUpdateInput
  ): Promise<ApiResponse<Event>> {
    return this.request(
      "PATCH",
      `/api/v1/events/${encodeURIComponent(idOrSlug)}`,
      input
    );
  }

  async deleteEvent(idOrSlug: string): Promise<{ message: string }> {
    return this.request(
      "DELETE",
      `/api/v1/events/${encodeURIComponent(idOrSlug)}`
    );
  }

  // ==================== REGISTRATIONS ====================

  async listRegistrations(
    eventIdOrSlug: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<Registration[]>> {
    const params = new URLSearchParams();
    if (options?.status) params.set("status", options.status);
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());

    const query = params.toString();
    return this.request(
      "GET",
      `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/registrations${query ? `?${query}` : ""}`
    );
  }

  async getRegistration(
    eventIdOrSlug: string,
    email: string
  ): Promise<ApiResponse<Registration>> {
    return this.request(
      "GET",
      `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/registrations/${encodeURIComponent(email)}`
    );
  }

  async createRegistration(
    eventIdOrSlug: string,
    input: RegistrationCreateInput
  ): Promise<ApiResponse<Registration>> {
    return this.request(
      "POST",
      `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/registrations`,
      input
    );
  }

  async updateRegistration(
    eventIdOrSlug: string,
    email: string,
    input: { name?: string; notes?: string; status?: string }
  ): Promise<ApiResponse<Registration>> {
    return this.request(
      "PATCH",
      `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/registrations/${encodeURIComponent(email)}`,
      input
    );
  }

  async deleteRegistration(
    eventIdOrSlug: string,
    email: string
  ): Promise<{ data: { message: string; promoted?: { email: string; name: string } } }> {
    return this.request(
      "DELETE",
      `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/registrations/${encodeURIComponent(email)}`
    );
  }

  // ==================== NOTIFICATIONS ====================

  async sendNotification(
    eventIdOrSlug: string,
    input: NotificationInput,
    preview = false
  ): Promise<ApiResponse<NotificationResult>> {
    const query = preview ? "?preview=true" : "";
    return this.request(
      "POST",
      `/api/v1/events/${encodeURIComponent(eventIdOrSlug)}/notify${query}`,
      input
    );
  }
}
