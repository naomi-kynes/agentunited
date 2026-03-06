import { AgentUnitedRealtimeClient } from "../src/index.js";

async function main() {
  const realtime = new AgentUnitedRealtimeClient({
    url: "ws://localhost:8080/ws",
    apiKey: "au_your_api_key_here",
  });

  realtime.on("new_message", (envelope) => {
    console.log("New message received:", envelope.message.text);
  });

  try {
    await realtime.connect();
    console.log("Realtime client connected.");

    realtime.send({
      type: "send_message",
      channel_id: "ch_id_here",
      text: "Realtime ping!",
    });
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

main();
