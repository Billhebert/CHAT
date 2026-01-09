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
  // OpenRouter models (free)
  { provider: "OpenRouter", key: openrouterKey, url: "openrouter.ai", path: "/api/chat/completions", model: "google/gemini-2.0-flash-exp:free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "OpenRouter", key: openrouterKey, url: "openrouter.ai", path: "/api/chat/completions", model: "deepseek/deepseek-r1:free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "OpenRouter", key: openrouterKey, url: "openrouter.ai", path: "/api/chat/completions", model: "meta-llama/llama-3.3-70b-instruct:free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "OpenRouter", key: openrouterKey, url: "openrouter.ai", path: "/api/chat/completions", model: "qwen/qwen3-8b:free", prompt: "Olá! Qual é o teu nome?" },
  
  // ZenMux models (free)
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "google/gemini-3-flash-preview-free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "xiaomi/mimo-v2-flash-free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "z-ai/glm-4.6v-flash-free", prompt: "Olá! Qual é o teu nome?" },
  
  // AIHubMix models (free)
  { provider: "AIHubMix", key: aihubmixKey, url: "aihubmix.com", path: "/api/v1/chat/completions", model: "coding-glm-4.7-free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "AIHubMix", key: aihubmixKey, url: "aihubmix.com", path: "/api/v1/chat/completions", model: "minimax-m2.1-free", prompt: "Olá! Qual é o teu nome?" },
];

async function testModel(test) {
  if (!test.key || test.key === "") {
    return { status: "❌ Sem API key", response: "" };
  }

  const postData = JSON.stringify({
    model: test.model,
    messages: [{ role: "user", content: test.prompt }],
    max_tokens: 100,
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
    options.headers["X-Title"] = "opencode";
  }

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            resolve({ status: "❌ Erro", response: json.error.message || json.error });
          } else {
            const content = json.choices?.[0]?.message?.content || "";
            resolve({ status: "✅ OK", response: content.substring(0, 150) });
          }
        } catch (e) {
          resolve({ status: "❌ Parse error", response: data.substring(0, 100) });
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
  console.log("🔹 TESTANDO MODELOS FREE DE PROVIDERS EXTERNOS");
  console.log("=" .repeat(70));
  console.log("");
  
  console.log("📋 API Keys disponíveis:");
  console.log(`  OpenRouter: ${openrouterKey ? "✅" : "❌"}`);
  console.log(`  ZenMux: ${zenmuxKey ? "✅" : "❌"}`);
  console.log(`  AIHubMix: ${aihubmixKey ? "✅" : "❌"}`);
  console.log("");

  let working = 0;
  let failed = 0;

  for (const test of modelsToTest) {
    const result = await testModel(test);
    const icon = result.status.includes("✅") ? "✅" : "❌";
    
    console.log(`${icon} ${test.provider} - ${test.model}`);
    console.log(`   ${result.response}`);
    console.log("");
    
    if (result.status.includes("✅")) working++;
    else failed++;

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("=" .repeat(70));
  console.log(`📊 Resumo: ${working} funcionando, ${failed} com problema`);
  console.log("=" .repeat(70));
}

runAllTests();
