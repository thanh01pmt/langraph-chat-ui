import { Client } from "@langchain/langgraph-sdk";

async function main() {
  const client = new Client({ apiUrl: "http://localhost:8124" });
  
  const thread = await client.threads.create();
  console.log("Created thread:", thread.thread_id);

  const stream = client.runs.stream(thread.thread_id, "agent", {
    input: {
      messages: [{
        type: "human",
        content: [{ type: "text", text: "Xin chao" }],
      }]
    },
    streamMode: "values",
  });

  try {
    for await (const chunk of stream) {
      console.log("Chunk event:", chunk.event);
      console.log("Chunk data:", JSON.stringify(chunk.data).substring(0, 200));
    }
  } catch (e) {
    console.error("Stream error:", e);
  }
}

main();
