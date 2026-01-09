const fs = require("fs");
const https = require("https");

const envContent = fs.readFileSync(".env", "utf-8");

function extractApiKey(name) {
  const match = envContent.match(new RegExp(`${name}_API_KEY=(.+)`));
  return match ? match[1].trim() : null;
}

const zenmuxKey = extractApiKey("ZENMUX");
const openrouterKey = extractApiKey("OPENROUTER");

const modelsToTest = [
  // ZenMux - different free models
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "openai/gpt-5-nano", prompt: "Olá! Qual é o teu nome?" },
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "openai/gpt-5-codex", prompt: "Olá! Qual é o teu nome?" },
  { provider: "ZenMux", key: zenmuxKey, url: "zenmux.ai", path: "/api/v1/chat/completions", model: "moonshotai/kimi-k2-thinking-turbo", prompt: "Olá! Qual é o teu nome?" },
  
  // OpenRouter - trying different models
  { provider: "OpenRouter", key: openrouterKey, url: "openrouter.ai", path: "/api/chat/completions", model: "deepseek/deepseek-r1-0528-qwen3-8b:free", prompt: "Olá! Qual é o teu nome?" },
  { provider: "OpenRouter", key: openrouterKey, url: "openrouter.ai", path: "/api/chat/completions", model: "qwen/qwen3-coder:free", prompt: "Olá! Qual é o teu nome?" },
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
    options.headers["X-Title"] = "OpenCode";
  }

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            resolve({ status: "❌", response: json.error.message || json.error });
          } else {
            const content = json.choices?.[0]?.message?.content || "";
            resolve({ status: "✅", response: content.substring(0, 120) });
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

async function runAllTests() {
  console.log("=" .repeat(70));
  console.log("🔹 TESTANDO MAIS MODELOS FREE");
  console.log("=" .repeat(70));
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
    await new Promise(r => setTimeout(r, 2500));
  }

  console.log("=" .repeat(70));
  console.log(`📊 Total: ${working} ✅ | ${failed} ❌`);
  console.log("=" .repeat(70));
}

runAllTests();
