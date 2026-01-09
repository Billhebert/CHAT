import { createOpencodeClient } from "@opencode-ai/sdk";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const SDK_URL = "http://127.0.0.1:4096";
const OPENCODE_CLI = "E:/app/OpenCode/opencode-cli.exe";

async function start() {
  console.log("🔄 Verificando servidor OpenCode...");
  
  // Check if server is already running
  try {
    const testClient = createOpencodeClient({ baseUrl: SDK_URL });
    const health = await testClient.global.health();
    console.log("✅ Servidor já rodando:", health);
    return;
  } catch (e) {
    console.log("📡 Servidor não encontrado, iniciando...");
  }
  
  // Start OpenCode server
  console.log(`🚀 Iniciando servidor: ${OPENCODE_CLI} serve --port 4096`);
  
  const serverProcess = spawn(OPENCODE_CLI, ["serve", "--port", "4096", "--hostname", "127.0.0.1"], {
    cwd: "C:\\Users\\Bill\\Desktop\\open",
    stdio: ["pipe", "pipe", "pipe"]
  });
  
  serverProcess.stdout.on("data", (data) => {
    console.log(`[OpenCode] ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on("data", (data) => {
    console.log(`[OpenCode ERR] ${data.toString().trim()}`);
  });
  
  serverProcess.on("close", (code) => {
    console.log(`[OpenCode] Servidor encerrado com código ${code}`);
  });
  
  // Wait for server to start
  console.log("⏳ Aguardando servidor...");
  
  let attempts = 0;
  const maxAttempts = 20;
  
  const checkServer = setInterval(async () => {
    attempts++;
    
    try {
      const testClient = createOpencodeClient({ baseUrl: SDK_URL });
      const health = await testClient.global.health();
      
      if (health && health.data) {
        clearInterval(checkServer);
        console.log("✅ Servidor iniciado com sucesso!");
        console.log(`   URL: ${SDK_URL}`);
        console.log(`   Versão: ${health.data.version || health.data.healthy}`);
        
        // Now start our app
        console.log("\n🚀 Iniciando aplicação...");
        
        // Import and start express app
        const { default: app } = await import("./server.js");
      }
    } catch (e) {
      if (attempts >= maxAttempts) {
        clearInterval(checkServer);
        console.log("❌ Timeout aguardando servidor");
        serverProcess.kill();
      }
    }
  }, 1000);
}

start().catch(console.error);
