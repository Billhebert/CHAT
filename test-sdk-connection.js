import { createOpencodeClient } from "@opencode-ai/sdk";

const SDK_URL = process.env.SDK_URL || "http://127.0.0.1:4096";

async function testSDK() {
  console.log("🔍 Testando SDK...\n");
  console.log("   URL:", SDK_URL);
  
  try {
    console.log("1. Criando cliente...");
    const client = createOpencodeClient({
      baseUrl: SDK_URL,
    });
    
    console.log("✅ Cliente criado");
    console.log("   client.global:", typeof client.global);
    console.log("   client.session:", typeof client.session);
    
    console.log("\n2. Testando health check...");
    const health = await client.global.health();
    console.log("   Health:", JSON.stringify(health, null, 2));
    
    console.log("\n3. Listando sessões...");
    const sessions = await client.session.list();
    console.log("   Sessões:", JSON.stringify(sessions, null, 2));
    
    console.log("\n✅ SDK funcionando!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    if (error.code) console.error("   Code:", error.code);
    if (error.cause) console.error("   Cause:", error.cause);
  }
}

testSDK();
