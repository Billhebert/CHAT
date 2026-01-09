import { createOpencode } from "@opencode-ai/sdk";

async function test() {
  console.log("🔍 Testando SDK...\n");
  
  try {
    const { client } = await createOpencode({
      hostname: "127.0.0.1",
      port: 8000,
      timeout: 30000,
    });
    
    console.log("✅ Conectado!");
    console.log("Client methods:", Object.keys(client));
    
    console.log("\n--- global ---");
    console.log("global:", Object.keys(client.global));
    
    console.log("\n--- session ---");
    console.log("session:", Object.keys(client.session));
    
    console.log("\n--- Test list sessions ---");
    const sessions = await client.session.list();
    console.log("Sessions:", sessions.data?.length || 0);
    
    console.log("\n--- Test create session ---");
    const session = await client.session.create({ body: { title: "Test" } });
    console.log("Session ID:", session.id || session.data?.id);
    
    console.log("\n--- Test prompt ---");
    const result = await client.session.prompt({
      path: { id: session.id || session.data?.id },
      body: { parts: [{ type: "text", text: "Hello!" }] }
    });
    console.log("Result:", JSON.stringify(result, null, 2).slice(0, 500));
    
    console.log("\n✅ Tudo funcionando!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

test();
