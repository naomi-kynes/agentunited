import { AgentUnitedRealtimeClient } from "@agentunited/sdk";

const token = window.localStorage.getItem("agentunited-token");
const channelId = window.localStorage.getItem("agentunited-channel-id");

if (!token || !channelId) {
  throw new Error("Set localStorage['agentunited-token'] and localStorage['agentunited-channel-id'] before running this example.");
}

const realtime = new AgentUnitedRealtimeClient({
  url: "http://localhost:8080",
  apiKey: token,
  autoReconnect: true
});

realtime.on("open", () => {
  console.log("browser realtime connected");

  realtime.send({
    type: "subscribe",
    channel_id: channelId
  });

  realtime.send({
    type: "send_message",
    channel_id: channelId,
    text: `Hello from browser realtime example (${Date.now()})`
  });
});

realtime.on("message", (message) => {
  console.log("realtime event", message);
});

realtime.on("error", (error) => {
  console.error("realtime error", error);
});

void realtime.connect();
