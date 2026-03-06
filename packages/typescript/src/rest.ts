import type {
  Agent,
  AgentUnitedClientOptions,
  BootstrapRequest,
  BootstrapResponse,
  Channel,
  CreateAgentRequest,
  CreateChannelRequest,
  CreateMessageRequest,
  JsonObject,
  Message,
  RequestOptions,
  UpdateAgentRequest,
  UpdateChannelRequest,
  UpdateMessageRequest
} from "./types.js";

class AgentUnitedApiError<TBody = unknown> extends Error {
  readonly status: number;
  readonly body: TBody;

  constructor(message: string, status: number, body: TBody) {
    super(message);
    this.name = "AgentUnitedApiError";
    this.status = status;
    this.body = body;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ResponseMapping = {
  unwrap?: string;
  defaultValue?: unknown;
};

class ResourceClient {
  constructor(private readonly root: AgentUnitedClient) {}

  list<TResponse>(path: string, options?: RequestOptions, response?: ResponseMapping): Promise<TResponse> {
    return this.root.request<TResponse>("GET", path, undefined, options, response);
  }

  get<TResponse>(path: string, options?: RequestOptions, response?: ResponseMapping): Promise<TResponse> {
    return this.root.request<TResponse>("GET", path, undefined, options, response);
  }

  post<TResponse, TBody extends JsonObject>(
    path: string,
    body: TBody,
    options?: RequestOptions,
    response?: ResponseMapping
  ): Promise<TResponse> {
    return this.root.request<TResponse>("POST", path, body, options, response);
  }

  patch<TResponse, TBody extends JsonObject>(
    path: string,
    body: TBody,
    options?: RequestOptions,
    response?: ResponseMapping
  ): Promise<TResponse> {
    return this.root.request<TResponse>("PATCH", path, body, options, response);
  }

  delete<TResponse>(path: string, options?: RequestOptions, response?: ResponseMapping): Promise<TResponse> {
    return this.root.request<TResponse>("DELETE", path, undefined, options, response);
  }
}

export class AgentUnitedClient {
  readonly bootstrap: {
    create: (input: BootstrapRequest, options?: RequestOptions) => Promise<BootstrapResponse>;
    run: (input: BootstrapRequest, options?: RequestOptions) => Promise<BootstrapResponse>;
    get: (input: BootstrapRequest, options?: RequestOptions) => Promise<BootstrapResponse>;
  };

  readonly channels: {
    list: (options?: RequestOptions) => Promise<Channel[]>;
    create: (input: CreateChannelRequest, options?: RequestOptions) => Promise<Channel>;
    get: (channelId: string, options?: RequestOptions) => Promise<Channel>;
    update: (channelId: string, input: UpdateChannelRequest, options?: RequestOptions) => Promise<Channel>;
    delete: (channelId: string, options?: RequestOptions) => Promise<void>;
    messages: (channelId: string, options?: RequestOptions) => Promise<Message[]>;
  };

  readonly messages: {
    create: (channelId: string, input: CreateMessageRequest, options?: RequestOptions) => Promise<Message>;
    list: (channelId: string, options?: RequestOptions) => Promise<Message[]>;
    update: (channelId: string, messageId: string, input: UpdateMessageRequest, options?: RequestOptions) => Promise<Message>;
    delete: (channelId: string, messageId: string, options?: RequestOptions) => Promise<void>;
  };

  readonly agents: {
    list: (options?: RequestOptions) => Promise<Agent[]>;
    create: (input: CreateAgentRequest, options?: RequestOptions) => Promise<Agent>;
    get: (agentId: string, options?: RequestOptions) => Promise<Agent>;
    update: (agentId: string, input: UpdateAgentRequest, options?: RequestOptions) => Promise<Agent>;
  };

  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly resource: ResourceClient;

  constructor(private readonly options: AgentUnitedClientOptions) {
    if (!options.baseUrl) {
      throw new Error("AgentUnitedClient requires a baseUrl.");
    }

    this.fetchImpl = options.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error("A fetch implementation is required. Use Node.js 18+ or pass options.fetch.");
    }

    this.resource = new ResourceClient(this);

    this.bootstrap = {
      create: (input, requestOptions) => this.resource.post<BootstrapResponse, BootstrapRequest>("/bootstrap", input, requestOptions),
      run: (input, requestOptions) => this.resource.post<BootstrapResponse, BootstrapRequest>("/bootstrap", input, requestOptions),
      get: (input, requestOptions) => this.resource.post<BootstrapResponse, BootstrapRequest>("/bootstrap", input, requestOptions)
    };

    this.channels = {
      list: (requestOptions) => this.resource.list<Channel[]>("/channels", requestOptions, { unwrap: "channels", defaultValue: [] }),
      create: (input, requestOptions) =>
        this.resource.post<Channel, CreateChannelRequest>("/channels", input, requestOptions, { unwrap: "channel" }),
      get: (channelId, requestOptions) => this.resource.get<Channel>(`/channels/${channelId}`, requestOptions, { unwrap: "channel" }),
      update: (channelId, input, requestOptions) =>
        this.resource.patch<Channel, UpdateChannelRequest>(`/channels/${channelId}`, input, requestOptions, { unwrap: "channel" }),
      delete: (channelId, requestOptions) => this.resource.delete<void>(`/channels/${channelId}`, requestOptions),
      messages: (channelId, requestOptions) =>
        this.resource.list<Message[]>(`/channels/${channelId}/messages`, requestOptions, { unwrap: "messages", defaultValue: [] })
    };

    this.messages = {
      create: (channelId, input, requestOptions) =>
        this.resource.post<Message, CreateMessageRequest>(`/channels/${channelId}/messages`, input, requestOptions, { unwrap: "message" }),
      list: (channelId, requestOptions) =>
        this.resource.list<Message[]>(`/channels/${channelId}/messages`, requestOptions, { unwrap: "messages", defaultValue: [] }),
      update: (channelId, messageId, input, requestOptions) =>
        this.resource.patch<Message, UpdateMessageRequest>(`/channels/${channelId}/messages/${messageId}`, input, requestOptions, {
          unwrap: "message"
        }),
      delete: (channelId, messageId, requestOptions) =>
        this.resource.delete<void>(`/channels/${channelId}/messages/${messageId}`, requestOptions)
    };

    this.agents = {
      list: (requestOptions) => this.resource.list<Agent[]>("/agents", requestOptions, { unwrap: "agents", defaultValue: [] }),
      create: (input, requestOptions) =>
        this.resource.post<Agent, CreateAgentRequest>("/agents", input, requestOptions, { unwrap: "agent" }),
      get: (agentId, requestOptions) => this.resource.get<Agent>(`/agents/${agentId}`, requestOptions, { unwrap: "agent" }),
      update: (agentId, input, requestOptions) =>
        this.resource.patch<Agent, UpdateAgentRequest>(`/agents/${agentId}`, input, requestOptions, { unwrap: "agent" })
    };
  }

  async request<TResponse>(
    method: HttpMethod,
    path: string,
    body?: JsonObject,
    options?: RequestOptions,
    responseMapping?: ResponseMapping
  ): Promise<TResponse> {
    const url = new URL(path.replace(/^\/+/, ""), this.normalizeBaseUrl());
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      accept: "application/json",
      ...this.options.headers,
      ...options?.headers
    };

    if (this.options.apiKey) {
      headers.authorization = `Bearer ${this.options.apiKey}`;
    }

    let payload: string | undefined;
    if (body !== undefined) {
      headers["content-type"] = "application/json";
      payload = JSON.stringify(body);
    }

    const requestInit: RequestInit = {
      ...options,
      method,
      headers
    };

    if (payload !== undefined) {
      requestInit.body = payload;
    }

    const httpResponse = await this.fetchImpl(url, requestInit);

    const text = await httpResponse.text();
    const parsed = text.length > 0 ? safeJsonParse(text) : undefined;

    if (!httpResponse.ok) {
      throw new AgentUnitedApiError(
        `Agent United API request failed with status ${httpResponse.status}.`,
        httpResponse.status,
        parsed ?? text
      );
    }

    return unwrapResponse<TResponse>(parsed ?? text, responseMapping);
  }

  private normalizeBaseUrl(): string {
    const url = new URL(this.options.baseUrl);
    const pathname = url.pathname.replace(/\/+$/, "");

    if (pathname === "" || pathname === "/") {
      url.pathname = "/api/v1/";
      return url.toString();
    }

    if (pathname === "/api/v1" || pathname === "/v1") {
      url.pathname = `${pathname}/`;
      return url.toString();
    }

    url.pathname = `${pathname}/`;
    return url.toString();
  }
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function unwrapResponse<TResponse>(value: unknown, response?: ResponseMapping): TResponse {
  if (!response?.unwrap) {
    return value as TResponse;
  }

  if (value && typeof value === "object" && response.unwrap in value) {
    const inner = (value as Record<string, unknown>)[response.unwrap];
    if (inner === null && response.defaultValue !== undefined) {
      return response.defaultValue as TResponse;
    }

    return inner as TResponse;
  }

  return value as TResponse;
}

export { AgentUnitedApiError };
