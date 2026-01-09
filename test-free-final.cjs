const fs = require("fs");
const https = require("https");

const envContent = fs.readFileSync(".env", "utf-8");

function extractApiKey(name) {
  const match = envContent.match(new RegExp(`${name}_API_KEY=(.+)`));
  return match ? match[1].trim() : null;
}

const zenmuxKey = extractApiKey("ZENMUX");
const cloudflareKey = extractApiKey("CLOUDFLARE_API_KEY");
const cloudflareAccount = extractApiKey("CLOUDFLARE_ACCOUNT_ID");

console.log("🔹 Testando modelos FREE de providers com chance de funcionar...");
console.log("");

const tests = [
  // ZenMux - native models (not OpenRouter prefixed)
  { name: "ZenMux", url: "zenmux.ai", path: "/api/v1/chat/completions", key: zenmuxKey, model: "google/gemini-3-flash-preview-free", prompt: "Olá! Qual é o teu nome?" },
  { name: "ZenMux", url: "zenmux.ai", path: "/api/v1/chat/completions", key: zenmuxKey, model: "z-ai/glm-4.5-air-free", prompt: "Olá! Qual é o teu nome?" },
  
  // Cloudflare Workers AI (different API format)
  { name: "Cloudflare", url: "api.cloudflare.com", path: "/client/v4/accounts/" + cloudflareAccount + "/ai/chat", key: cloudflareKey, model: "@cf/meta/llama-3-8b-instruct", prompt: "Olá! Qual é o teu nome?", isCF: true },
  { name: "Cloudflare", url: "api.cloudflare.com", path: "/client/v4/accounts/" + cloudflareAccount + "/ai/chat", key: cloudflareKey, model: "@cf/meta/llama-3-70b-instruct", prompt: "Olá! Qual é o teu nome?", isCF: true },
  { name: "Cloudflare", url: "api.cloudflare.com", path: "/client/v4/accounts/" + cloudflareAccount + "/ai/chat", key: cloudflareKey, model: "@cf/mistral/mistral-7b-instruct-v0.1", prompt: "Olá! Qual é o teu nome?", isCF: true },
];

async function test(test) {
  if (!test.key) {
    return { status: "❌", response: "Sem API key" };
  }

  let postData, options;

  if (test.isCF) {
    postData = JSON.stringify({
      messages: [{ role: "user", content: test.prompt }],
      max_tokens: 60,
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
      max_tokens: 60,
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
          if (json.error) {
            resolve({ status: "❌", response: json.error.message || json.error });
          } else {
            const content = test.isCF ? json.response : json.choices?.[0]?.message?.content || "";
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

async function run() {
  let working = 0, failed = 0;

  for (const t of tests) {
    console.log(`🔸 ${t.model} (${t.name})`);
    const r = await test(t);
    console.log(`   ${r.status} ${r.response}`);
    if (r.status === "✅") working++; else failed++;
    console.log("");
    await new Promise(x => setTimeout(x, 2000));
  }

  console.log("=" .repeat(70));
  console.log(`📊 Total: ${working} funcionando, ${failed} com problema`);
  console.log("=" .repeat(70));
}

run();
