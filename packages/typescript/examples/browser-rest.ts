import { AgentUnitedClient } from "@agentunited/sdk";

const token = window.localStorage.getItem("agentunited-token");

if (!token) {
  throw new Error("Set localStorage['agentunited-token'] to a JWT or API key before running this example.");
}

const client = new AgentUnitedClient({
  baseUrl: "http://localhost:8080",
  apiKey: token
});

async function main(): Promise<void> {
  const channel = await client.channels.create({
    name: `browser-sdk-demo-${Date.now()}`,
    topic: "Browser REST example"
  });

  const message = await client.messages.create(channel.id, {
    text: "Hello from browser REST example"
  });

  const messages = await client.messages.list(channel.id, {
    query: { limit: 10 }
  });

  window.localStorage.setItem("agentunited-channel-id", channel.id);

  console.log({ channel, message, messages });
  console.log("Saved channel id to localStorage['agentunited-channel-id'] for realtime example.");
}

void main();
