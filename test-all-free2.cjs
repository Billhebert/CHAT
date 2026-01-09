const fs = require("fs");
const https = require("https");

const envContent = fs.readFileSync(".env", "utf-8");

function extractApiKey(name) {
  const match = envContent.match(new RegExp(`${name}_API_KEY=(.+)`));
  return match ? match[1].trim() : null;
}

const zenmuxKey = extractApiKey("ZENMUX");
const openrouterKey = extractApiKey("OPENROUTER");
const aihubmixKey = extractApiKey("AIHUBMIX");

const freeModels = [
  // ZenMux models (likely to work)
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "openrouter/google/gemma-2-9b-it:free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "openrouter/qwen/qwen3-8b:free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "openrouter/deepseek/deepseek-r1:free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "openrouter/meta-llama/llama-3.3-70b-instruct:free", prompt: "Olá! Qual é o teu nome?" },
  
  // Cloudflare Workers AI (has some free models)
  { provider: "Cloudflare", key: "", url: "api.cloudflare.com", path: "/client/v4/ai/chat", model: "@cf/meta/llama-3-8b-instruct", prompt: "Olá! Qual é o teu nome?", isCF: true },
  
  // HuggingFace (free Inference API)
  { provider: "HuggingFace", key: extractApiKey("HF_TOKEN"), url: "api-inference.huggingface.co", path: "/models/meta-llama/Llama-3.2-1B-Instruct", prompt: "Olá! Qual é o teu nome?", isHF: true },
];

async function testModel(test) {
  if (!test.key && !test.isCF && !test.isHF) {
    return { status: "❌", response: "Sem API key" };
  }

  let postData, options;

  if (test.isCF) {
    // Cloudflare doesn't need auth for some models
    postData = JSON.stringify({
      messages: [{ role: "user", content: test.prompt }],
      max_tokens: 50,
    });
    options = {
      hostname: test.url,
      path: test.path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };
  } else if (test.isHF) {
    postData = JSON.stringify({
      inputs: test.prompt,
      parameters: { max_new_tokens: 50 },
    });
    options = {
      hostname: test.url,
      path: test.path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${test.key}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };
  } else {
    postData = JSON.stringify({
      model: test.model,
      messages: [{ role: "user", content: test.prompt }],
      max_tokens: 50,
    });
    options = {
      hostname: test.url,
      path: test.path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${test.key}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };
  }

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          let content = "";
          
          if (test.isHF) {
            content = Array.isArray(json) ? json[0]?.generated_text || "" : json.generated_text || "";
          } else {
            content = json.choices?.[0]?.message?.content || json.response || "";
          }
          
          if (json.error) {
            resolve({ status: "❌", response: (json.error.message || json.error).substring(0, 80) });
          } else if (content) {
            resolve({ status: "✅", response: content.substring(0, 100) });
          } else {
            resolve({ status: "❌", response: "Sem conteúdo" });
          }
        } catch (e) {
          resolve({ status: "❌", response: data.substring(0, 80) });
        }
      });
    });

    req.on("error", (e) => resolve({ status: "❌", response: e.message }));
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log("=" .repeat(70));
  console.log("🔹 TESTANDO MODELOS FREE EXTERNOS");
  console.log("=" .repeat(70));
  console.log("");
  console.log("📋 API Keys:");
  console.log(`  ZenMux: ${zenmuxKey ? "✅" : "❌"}`);
  console.log(`  OpenRouter: ${openrouterKey ? "✅" : "❌"}`);
  console.log(`  HuggingFace: ${extractApiKey("HF_TOKEN") ? "✅" : "❌"}`);
  console.log("");

  let working = 0;
  let failed = 0;

  for (const test of freeModels) {
    console.log(`🔸 ${test.model} (${test.provider})`);
    
    const result = await testModel(test);
    console.log(`   ${result.status} ${result.response}`);
    
    if (result.status === "✅") working++;
    else failed++;
    
    console.log("");
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("=" .repeat(70));
  console.log(`📊 Total: ${working} funcionando, ${failed} com problema`);
  console.log("=" .repeat(70));
}

runTests();
