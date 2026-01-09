const fs = require("fs");
const https = require("https");

const envContent = fs.readFileSync(".env", "utf-8");

function extractApiKey(name) {
  const match = envContent.match(new RegExp(`${name}_API_KEY=(.+)`));
  return match ? match[1].trim() : null;
}

const openrouterKey = extractApiKey("OPENROUTER");
const zenmuxKey = extractApiKey("ZENMUX");
const aihubmixKey = extractApiKey("AIHUBMIX");

const modelsToTest = [
  // ZenMux models (working)
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "xiaomi/mimo-v2-flash-free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "google/gemini-3-flash-preview-free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "z-ai/glm-4.6v-flash-free", prompt: "Olá! Qual é o teu nome?" },
  
  // AIHubMix - trying different paths
  { provider: "AIHubMix", key: aihubmixKey, url: "aihubmix.com", path: "/chat/completions", model: "coding-glm-4.7-free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "AIHubMix", key: aihubmixKey, url: "api.aihubmix.com", path: "/v1/chat/completions", model: "coding-glm-4.7-free", prompt: "Olá! Qual é o teu nome?" },
  
  // OpenRouter - trying without extra headers
  { provider: "OpenRouter", key: openrouterKey, url: "openrouter.ai", path: "/api/chat/completions", model: "google/gemini-2.0-flash-exp:free", prompt: "Olá! Qual é o teu nome?" },
];

async function testModel(test) {
  if (!test.key || test.key === "") {
    return { status: "❌ Sem API key", response: "" };
  }

  const postData = JSON.stringify({
    model: test.model,
    messages: [{ role: "user", content: test.prompt }],
    max_tokens: 80,
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

  if (test.provider === "OpenRouter") {
    options.headers["HTTP-Referer"] = "https://opencode.ai";
    options.headers["X-Title"] = "OpenCode Dashboard";
  }

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            resolve({ status: "❌ Erro", response: json.error.message || JSON.stringify(json.error) });
          } else {
            const content = json.choices?.[0]?.message?.content || "";
            resolve({ status: "✅ OK", response: content.substring(0, 150) });
          }
        } catch (e) {
          if (data.startsWith("<")) {
            resolve({ status: "❌ HTML", response: "Retornou página HTML" });
          } else {
            resolve({ status: "❌ Parse", response: data.substring(0, 100) });
          }
        }
      });
    });

    req.on("error", (e) => resolve({ status: "❌ Erro", response: e.message }));
    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log("=" .repeat(70));
  console.log("🔹 TESTANDO MODELOS FREE (CORRIGIDO)");
  console.log("=" .repeat(70));
  console.log("");

  let working = 0;
  let failed = 0;

  for (const test of modelsToTest) {
    console.log(`🔸 ${test.provider} - ${test.model}`);
    
    const result = await testModel(test);
    const icon = result.status.includes("✅") ? "✅" : "❌";
    
    console.log(`   ${icon} ${result.response}`);
    
    if (result.status.includes("✅")) working++;
    else failed++;
    
    console.log("");
    await new Promise(r => setTimeout(r, 2500));
  }

  console.log("=" .repeat(70));
  console.log(`📊 Resumo: ${working} funcionando, ${failed} com problema`);
  console.log("=" .repeat(70));
}

runAllTests();
