import { AgentUnitedApiError, AgentUnitedClient, AgentUnitedRealtimeClient } from "../dist/index.js";

const instanceUrl = process.env.AGENTUNITED_API_URL ?? "http://127.0.0.1:8080";
const testEmail = `sdk-stable-prep-${Date.now()}@example.com`;
const testPassword = "SdkStablePrep123!";

async function main() {
  const bootstrapStatus = await testBootstrap();
  const token = await createSessionToken();
  const client = new AgentUnitedClient({
    baseUrl: instanceUrl,
    apiKey: token
  });

  const channelsBefore = await client.channels.list();
  const channel = await client.channels.create({
    name: `sdk-stable-prep-${Date.now()}`,
    topic: "TypeScript SDK localhost validation"
  });
  const message = await client.messages.create(channel.id, {
    text: "hello from the local SDK validation"
  });
  const messages = await client.messages.list(channel.id, {
    query: { limit: 10 }
  });

  if (!messages.some((entry) => entry.id === message.id)) {
    throw new Error("REST message round-trip failed: created message was not returned by list().");
  }

  const realtime = new AgentUnitedRealtimeClient({
    url: instanceUrl,
    apiKey: token,
    autoReconnect: false
  });

  const realtimeEvents = [];
  const wsMessageText = `hello from websocket validation (${Date.now()})`;

  const stopMessageCapture = realtime.on("message", (event) => {
    realtimeEvents.push(event);
  });

  await realtime.connect();
  realtime.send({
    type: "subscribe",
    channel_id: channel.id
  });

  await waitFor(() => realtimeEvents.some((event) => event.type === "subscribed"));

  realtime.send({
    type: "send_message",
    channel_id: channel.id,
    text: wsMessageText
  });

  await waitFor(() =>
    realtimeEvents.some((event) => {
      if (event.type === "message_sent") {
        return true;
      }

      const payload = typeof event.payload === "object" && event.payload !== null ? event.payload : event;
      const text = payload?.text ?? payload?.message?.text;
      return typeof text === "string" && text.includes("hello from websocket validation");
    })
  );

  const realtimeError = realtimeEvents.find((event) => event.type === "error");
  if (realtimeError) {
    throw new Error(`Realtime send failed: ${JSON.stringify(realtimeError)}`);
  }

  const messagesAfterRealtime = await client.messages.list(channel.id, {
    query: { limit: 25 }
  });

  if (!messagesAfterRealtime.some((entry) => entry.text === wsMessageText)) {
    throw new Error("Realtime message send failed: websocket message not returned by REST list().");
  }

  stopMessageCapture();
  realtime.disconnect();

  console.log(JSON.stringify({
    instanceUrl,
    bootstrapStatus,
    channelsBefore: channelsBefore.length,
    channelId: channel.id,
    messageId: message.id,
    messageCount: messages.length,
    realtimeEvents: realtimeEvents.map((event) => event.type),
    realtimeRoundTripVerified: true
  }, null, 2));
}

async function testBootstrap() {
  const client = new AgentUnitedClient({ baseUrl: instanceUrl });

  try {
    await client.bootstrap.create({
      primary_agent: {
        email: `bootstrap-${Date.now()}@example.com`,
        password: "BootstrapValidation123!",
        agent_profile: {
          name: "sdk-bootstrap-check",
          display_name: "SDK Bootstrap Check",
          description: "Bootstrap validation payload for the TypeScript SDK"
        }
      },
      agents: [
        {
          name: "sdk-worker",
          display_name: "SDK Worker"
        }
      ],
      humans: [
        {
          email: `human-${Date.now()}@example.com`,
          display_name: "SDK Human",
          role: "observer"
        }
      ],
      default_channel: {
        name: "sdk-bootstrap",
        topic: "Bootstrap validation"
      }
    });

    return 201;
  } catch (error) {
    if (error instanceof AgentUnitedApiError && error.status === 409) {
      return 409;
    }

    throw error;
  }
}

async function createSessionToken() {
  const response = await fetch(new URL("/api/v1/auth/register", ensureTrailingSlash(instanceUrl)), {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      display_name: "SDK Stable Prep"
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to register local integration user: ${response.status} ${await response.text()}`);
  }

  const parsed = await response.json();
  if (!parsed || typeof parsed !== "object" || typeof parsed.token !== "string") {
    throw new Error("Local auth/register response did not include a token.");
  }

  return parsed.token;
}

async function waitFor(predicate, timeoutMs = 3_000, intervalMs = 50) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Timed out waiting for realtime events.");
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
