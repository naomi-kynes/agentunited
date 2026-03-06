import type { AgentUnitedRealtimeOptions, JsonObject, RealtimeEnvelope, RealtimeEventMap } from "./types.js";

type EventHandler<TEvent> = (event: TEvent) => void;

type WebSocketLike = {
  readonly readyState: number;
  close(code?: number, reason?: string): void;
  send(data: string): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
};

type WebSocketLikeConstructor = NonNullable<AgentUnitedRealtimeOptions["WebSocketImpl"]>;

class TypedEmitter<TEvents extends object> {
  private readonly listeners = new Map<keyof TEvents, Set<EventHandler<unknown>>>();

  on<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): () => void {
    const current = this.listeners.get(event) ?? new Set<EventHandler<unknown>>();
    current.add(handler as EventHandler<unknown>);
    this.listeners.set(event, current);

    return () => {
      current.delete(handler as EventHandler<unknown>);
      if (current.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    for (const handler of this.listeners.get(event) ?? []) {
      (handler as EventHandler<TEvents[TKey]>)(payload);
    }
  }
}

export class AgentUnitedRealtimeClient {
  private readonly emitter = new TypedEmitter<RealtimeEventMap>();
  private socket: WebSocketLike | undefined;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private reconnectAttempt = 0;
  private manuallyClosed = false;

  constructor(private readonly options: AgentUnitedRealtimeOptions) {}

  on<TKey extends keyof RealtimeEventMap>(
    event: TKey,
    handler: (payload: RealtimeEventMap[TKey]) => void
  ): () => void {
    return this.emitter.on(event, handler);
  }

  async connect(): Promise<void> {
    this.manuallyClosed = false;

    const WebSocketImpl = this.getWebSocketImplementation();
    const socket = new WebSocketImpl(this.normalizeUrl(), this.options.protocols);
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      let settled = false;

      socket.addEventListener("open", () => {
        if (settled) {
          return;
        }

        settled = true;
        this.reconnectAttempt = 0;
        this.emitter.emit("open", new Event("open"));
        resolve();
      });

      socket.addEventListener("error", () => {
        const normalized = new Error("WebSocket connection failed.");
        this.emitter.emit("error", normalized);

        if (!settled) {
          settled = true;
          reject(normalized);
        }
      });

      socket.addEventListener("message", (event) => {
        void parseEnvelope((event as MessageEvent).data).then((message) => {
          this.emitter.emit("message", message);
        });
      });

      socket.addEventListener("close", (event) => {
        const closeEvent = event as CloseEvent;
        this.emitter.emit("close", {
          code: closeEvent.code,
          reason: closeEvent.reason
        });
        this.socket = undefined;

        if (!settled) {
          settled = true;
          reject(new Error(`WebSocket closed before opening (code ${closeEvent.code}).`));
        }

        if (!this.manuallyClosed && this.options.autoReconnect !== false) {
          this.scheduleReconnect();
        }
      });
    });
  }

  disconnect(code = 1000, reason = "Client disconnect"): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    this.socket?.close(code, reason);
    this.socket = undefined;
  }

  send<TPayload extends JsonObject | string>(message: RealtimeEnvelope<TPayload>): void {
    if (!this.socket || this.socket.readyState !== 1) {
      throw new Error("WebSocket is not connected.");
    }

    this.socket.send(JSON.stringify(message));
  }

  private scheduleReconnect(): void {
    const delayMs = this.options.reconnectDelayMs ?? 1_000;
    this.reconnectAttempt += 1;
    this.emitter.emit("reconnecting", {
      attempt: this.reconnectAttempt,
      delayMs
    });

    this.reconnectTimer = setTimeout(() => {
      void this.connect().catch((error) => {
        this.emitter.emit("error", normalizeError(error));
      });
    }, delayMs);
  }

  private getWebSocketImplementation(): WebSocketLikeConstructor {
    if (this.options.WebSocketImpl) {
      return this.options.WebSocketImpl;
    }

    if (typeof globalThis.WebSocket === "function") {
      return globalThis.WebSocket as unknown as WebSocketLikeConstructor;
    }

    throw new Error("A WebSocket implementation is required. Pass options.WebSocketImpl in Node runtimes without global WebSocket.");
  }

  private normalizeUrl(): string {
    const url = new URL(this.options.url);

    if (url.protocol === "http:") {
      url.protocol = "ws:";
    } else if (url.protocol === "https:") {
      url.protocol = "wss:";
    }

    const pathname = url.pathname.replace(/\/+$/, "");
    if (pathname === "" || pathname === "/") {
      url.pathname = "/ws";
    }

    if (this.options.apiKey && !url.searchParams.has("token")) {
      url.searchParams.set("token", this.options.apiKey);
    }

    return url.toString();
  }
}

async function parseEnvelope(data: unknown): Promise<RealtimeEnvelope> {
  const text = await normalizeMessageData(data);

  try {
    return JSON.parse(text) as RealtimeEnvelope;
  } catch {
    return {
      type: "raw",
      payload: text
    };
  }
}

async function normalizeMessageData(data: unknown): Promise<string> {
  if (typeof data === "string") {
    return data;
  }

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    return data.text();
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(data));
  }

  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(data);
  }

  return String(data);
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
