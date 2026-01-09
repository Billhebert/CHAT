import { createOpencode } from "@opencode-ai/sdk";

console.log("🔍 Testando conexão com Opencode SDK...\n");

async function test() {
  try {
    console.log("1. Tentando criar servidor Opencode...");
    const opencode = await createOpencode({
      hostname: "127.0.0.1",
      port: 4096,
      timeout: 20000,
      config: { model: "anthropic/claude-3-5-sonnet-20241022" },
    });
    
    console.log("✅ Sucesso!");
    console.log(`   URL: ${opencode.server.url}`);
    
    // Test health
    console.log("\n2. Testando health check...");
    const health = await opencode.client.global.health();
    console.log(`   Health: ${JSON.stringify(health)}`);
    
    await opencode.server.close();
    console.log("\n🛑 Servidor fechado.");
  } catch (error) {
    console.log("❌ Erro:");
    console.log(`   Message: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    if (error.cause) console.log(`   Cause: ${JSON.stringify(error.cause)}`);
  }
}

test();
