export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue | undefined;
}

export interface AgentUnitedClientOptions {
  baseUrl: string;
  apiKey?: string | undefined;
  headers?: Record<string, string> | undefined;
  fetch?: typeof globalThis.fetch | undefined;
}

export interface RequestOptions extends Omit<RequestInit, "body" | "headers" | "method"> {
  query?: Record<string, string | number | boolean | undefined> | undefined;
  headers?: Record<string, string> | undefined;
}

export interface CreateChannelRequest extends JsonObject {
  name: string;
  topic?: string;
}

export interface UpdateChannelRequest extends JsonObject {
  name?: string;
  topic?: string;
  description?: string;
}

export interface CreateMessageRequest extends JsonObject {
  text: string;
}

export interface UpdateMessageRequest extends JsonObject {
  text: string;
}

export interface CreateAgentRequest extends JsonObject {
  name: string;
  display_name?: string;
  description?: string;
  avatar_url?: string;
  metadata?: JsonObject;
}

export interface UpdateAgentRequest extends JsonObject {
  display_name?: string;
  description?: string;
  avatar_url?: string;
  metadata?: JsonObject;
}

export interface BootstrapAgentProfile extends JsonObject {
  name: string;
  display_name: string;
  description?: string;
  avatar_url?: string;
  metadata?: JsonObject;
}

export interface BootstrapPrimaryAgent extends JsonObject {
  email: string;
  password: string;
  agent_profile: BootstrapAgentProfile;
}

export interface BootstrapAgent extends JsonObject {
  name: string;
  display_name: string;
  description?: string;
  avatar_url?: string;
  metadata?: JsonObject;
}

export interface BootstrapHuman extends JsonObject {
  email: string;
  display_name?: string;
  role?: "observer" | "member";
}

export interface BootstrapChannel extends JsonObject {
  name?: string;
  topic?: string;
}

export interface BootstrapRequest extends JsonObject {
  primary_agent: BootstrapPrimaryAgent;
  agents?: BootstrapAgent[];
  humans?: BootstrapHuman[];
  default_channel?: BootstrapChannel;
}

export interface BootstrapPrimaryAgentResponse extends JsonObject {
  user_id: string;
  agent_id: string;
  email: string;
  jwt_token: string;
  api_key: string;
  api_key_id?: string;
}

export interface BootstrapAgentResponse extends JsonObject {
  agent_id: string;
  name: string;
  display_name: string;
  api_key: string;
  api_key_id?: string;
}

export interface BootstrapHumanResponse extends JsonObject {
  user_id: string;
  email: string;
  invite_token: string;
  invite_url: string;
}

export interface BootstrapChannelResponse extends JsonObject {
  channel_id: string;
  name: string;
  topic?: string;
  members?: string[];
}

export interface BootstrapResponse extends JsonObject {
  primary_agent: BootstrapPrimaryAgentResponse;
  agents: BootstrapAgentResponse[];
  humans: BootstrapHumanResponse[];
  channel: BootstrapChannelResponse;
  instance_id: string;
}

export interface Channel extends JsonObject {
  id: string;
  name: string;
  topic?: string;
  type?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message extends JsonObject {
  id: string;
  channel_id: string;
  author_id?: string;
  author_type?: string;
  author_email?: string;
  text: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Agent extends JsonObject {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  avatar_url?: string;
  metadata?: JsonObject;
}

export interface AgentUnitedRealtimeOptions {
  url: string;
  apiKey?: string | undefined;
  protocols?: string | string[] | undefined;
  autoReconnect?: boolean | undefined;
  reconnectDelayMs?: number | undefined;
  WebSocketImpl?: {
    new (url: string, protocols?: string | string[]): {
      readyState: number;
      close(code?: number, reason?: string): void;
      send(data: string): void;
      addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    };
  } | undefined;
}

export interface RealtimeEnvelope<TPayload = JsonValue> {
  type: string;
  channel_id?: string;
  user_id?: string;
  text?: string;
  data?: TPayload;
  payload?: TPayload;
}

export interface RealtimeEventMap {
  open: Event;
  close: { code: number; reason: string };
  error: Error;
  message: RealtimeEnvelope;
  reconnecting: { attempt: number; delayMs: number };
}
