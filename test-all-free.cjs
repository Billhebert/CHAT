const fs = require("fs");
const https = require("https");
const http = require("http");

function extractApiKey(envContent, name) {
  const match = envContent.match(new RegExp(`${name}_API_KEY=(.+)`));
  return match ? match[1].trim() : null;
}

async function testFreeModels() {
  const envContent = fs.readFileSync(".env", "utf-8");

  const providers = [
    { name: "ZENMUX", url: "zenmux.ai", path: "/api/v1/chat/completions", key: extractApiKey(envContent, "ZENMUX") },
  ];

  const freeModels = [
    { provider: "ZENMUX", model: "google/gemini-3-flash-preview-free", prompt: "Olá! Qual é o teu nome?" },
    { provider: "ZENMUX", model: "xiaomi/mimo-v2-flash-free", prompt: "Olá! Qual é o teu nome?" },
    { provider: "ZENMUX", model: "z-ai/glm-4.6v-flash-free", prompt: "Olá! Qual é o teu nome?" },
  ];

  for (const test of freeModels) {
    const prov = providers.find(p => p.name === test.provider);
    if (!prov || !prov.key) {
      console.log(`\n❌ ${test.provider}: API key não encontrada`);
      continue;
    }

    console.log(`\n🔹 Testando ${test.model}...`);

    const postData = JSON.stringify({
      model: test.model,
      messages: [{ role: "user", content: test.prompt }],
      max_tokens: 50,
    });

    const options = {
      hostname: prov.url,
      path: prov.path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${prov.key}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const requester = prov.url === "zenmux.ai" ? https : http;

    await new Promise((resolve) => {
      const req = requester.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              console.log(`❌ Erro: ${json.error.message}`);
            } else {
              const content = json.choices?.[0]?.message?.content || "Sem resposta";
              console.log(`✅ ${content}`);
            }
          } catch (e) {
            console.log(`❌ Erro: ${e.message}`);
          }
          resolve();
        });
      });

      req.on("error", (e) => {
        console.log(`❌ Erro: ${e.message}`);
        resolve();
      });
      req.write(postData);
      req.end();
    });

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("\n✅ Teste completo!");
}

testFreeModels();
