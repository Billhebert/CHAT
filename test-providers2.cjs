const fs = require("fs");
const https = require("https");

const envContent = fs.readFileSync(".env", "utf-8");

function extractApiKey(name) {
  const match = envContent.match(new RegExp(`${name}_API_KEY=(.+)`));
  return match ? match[1].trim() : null;
}

const keys = {
  OPENROUTER: extractApiKey("OPENROUTER"),
  ZENMUX: extractApiKey("ZENMUX"),
  TOGETHER: extractApiKey("TOGETHER"),
  GROQ: extractApiKey("GROQ"),
  DEEPSEEK: extractApiKey("DEEPSEEK"),
  FIREWORKS: extractApiKey("FIREWORKS"),
  SCALEWAY: extractApiKey("SCALEWAY"),
  SILICONFLOW: extractApiKey("SILICONFLOW"),
  VENICE: extractApiKey("VENICE"),
  DEEPINFRA: extractApiKey("DEEPINFRA"),
};

const modelsToTest = [
  // Groq - known for free tier
  { provider: "Groq", key: keys.GROQ, url: "api.groq.com", path: "/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", prompt: "Olá! Qual é o teu nome?" },
  { provider: "Groq", key: keys.GROQ, url: "api.groq.com", path: "/openai/v1/chat/completions", model: "mixtral-8x7b-32768", prompt: "Olá! Qual é o teu nome?" },
  
  // Together AI
  { provider: "Together", key: keys.TOGETHER, url: "api.together.ai", path: "/v1/chat/completions", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", prompt: "Olá! Qual é o teu nome?" },
  
  // DeepSeek
  { provider: "DeepSeek", key: keys.DEEPSEEK, url: "api.deepseek.com", path: "/chat/completions", model: "deepseek-chat", prompt: "Olá! Qual é o teu nome?" },
  
  // Fireworks
  { provider: "Fireworks", key: keys.FIREWORKS, url: "api.fireworks.ai", path: "/inference/v1/chat/completions", model: "accounts/fireworks/models/llama-v3-70b-instruct", prompt: "Olá! Qual é o teu nome?" },
  
  // SiliconFlow - has free tier
  { provider: "SiliconFlow", key: keys.SILICONFLOW, url: "api.siliconflow.com", path: "/v1/chat/completions", model: "Qwen/Qwen2.5-72B-Instruct", prompt: "Olá! Qual é o teu nome?" },
  
  // Venice AI
  { provider: "Venice", key: keys.VENICE, url: "api.venice.ai", path: "/api/v1/chat/completions", model: "venice-uncensored", prompt: "Olá! Qual é o teu nome?" },
  
  // DeepInfra
  { provider: "DeepInfra", key: keys.DEEPINFRA, url: "api.deepinfra.com", path: "/v1/openai/chat/completions", model: "meta-llama/Llama-3.3-70B-Instruct", prompt: "Olá! Qual é o teu nome?" },
];

async function testModel(test) {
  if (!test.key || test.key === "") {
    return { status: "❌", response: "Sem API key" };
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

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            resolve({ status: "❌", response: (json.error.message || json.error).substring(0, 80) });
          } else {
            const content = json.choices?.[0]?.message?.content || "";
            resolve({ status: "✅", response: content.substring(0, 100) });
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
  console.log("🔹 TESTANDO MODELOS DE PROVIDERS COM API KEY");
  console.log("=" .repeat(70));
  console.log("");
  
  console.log("📋 API Keys:");
  for (const [name, key] of Object.entries(keys)) {
    console.log(`  ${name}: ${key ? "✅" : "❌"}`);
  }
  console.log("");

  let working = 0;
  let failed = 0;

  for (const test of modelsToTest) {
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
