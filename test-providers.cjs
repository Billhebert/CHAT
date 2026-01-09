const fs = require("fs");
const https = require("https");

const envContent = fs.readFileSync(".env", "utf-8");

function extractApiKey(name) {
  const match = envContent.match(new RegExp(`${name}_API_KEY=(.+)`));
  return match ? match[1].trim() : null;
}

const openrouterKey = extractApiKey("OPENROUTER");
const zenmuxKey = extractApiKey("ZENMUX");

console.log("🔹 API Keys disponíveis:");
console.log(`  OpenRouter: ${openrouterKey ? "✅ Configurada" : "❌ Não encontrada"}`);
console.log(`  ZenMux: ${zenmuxKey ? "✅ Configurada" : "❌ Não encontrada"}`);
console.log("");

const tests = [
  { name: "OpenRouter", key: openrouterKey, url: "openrouter.ai", path: "/api/chat/completions", model: "google/gemini-2.0-flash-exp:free" },
  { name: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "xiaomi/mimo-v2-flash-free" },
  { name: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "z-ai/glm-4.6v-flash-free" },
];

async function runTests() {
  for (const test of tests) {
    if (!test.key || test.key === "") {
      console.log(`\n❌ ${test.name}: API key não configurada`);
      continue;
    }

    console.log(`\n🔸 Testando ${test.model} via ${test.name}...`);

    const postData = JSON.stringify({
      model: test.model,
      messages: [{ role: "user", content: "Olá! Qual é o teu nome?" }],
      max_tokens: 50,
    });

    const options = {
      hostname: test.url,
      path: test.path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${test.key}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    if (test.name === "OpenRouter") {
      options.headers["HTTP-Referer"] = "https://opencode.ai";
      options.headers["X-Title"] = "opencode";
    }

    await new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              console.log(`  ❌ Erro: ${json.error.message || json.error}`);
            } else {
              const content = json.choices?.[0]?.message?.content || "Sem resposta";
              console.log(`  ✅ ${content.substring(0, 100)}`);
            }
          } catch (e) {
            console.log(`  ❌ Resposta não é JSON (${data.length} chars): ${data.substring(0, 200)}`);
          }
          resolve();
        });
      });

      req.on("error", (e) => {
        console.log(`  ❌ Erro: ${e.message}`);
        resolve();
      });
      req.write(postData);
      req.end();
    });

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("\n✅ Teste completo!");
}

runTests();
