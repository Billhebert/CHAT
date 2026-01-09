import { createOpencode } from "@opencode-ai/sdk";

console.log("🔍 Testando createOpencode...\n");

async function test() {
  try {
    console.log("1. Iniciando OpenCode...");
    const opencode = await createOpencode({
      hostname: "127.0.0.1",
      port: 5003,
      timeout: 30000,
      config: {
        model: "opencode/minimax-m2.1-free",
      },
    });
    
    console.log("✅ OpenCode iniciado!");
    console.log("   Server URL:", opencode.server.url);
    
    const client = opencode.client;
    console.log("   Client keys:", Object.keys(client));
    
    console.log("\n2. Listando sessões...");
    const sessions = await client.session.list();
    console.log("   Sessions:", JSON.stringify(sessions, null, 2));
    
    console.log("\n3. Criando sessão...");
    const session = await client.session.create({
      body: { title: "SDK Test Session" }
    });
    console.log("   Session ID:", session.id || session.data?.id);
    
    console.log("\n4. Enviando prompt...");
    const result = await client.session.prompt({
      path: { id: session.id || session.data?.id },
      body: {
        parts: [{ type: "text", text: "Hello! How are you?" }],
      },
    });
    console.log("   Result:", JSON.stringify(result, null, 2));
    
    console.log("\n✅ Tudo funcionando!");
    
    await opencode.server.close();
    console.log("🛑 Servidor fechado.");
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    if (error.code) console.error("   Code:", error.code);
  }
}

test();
