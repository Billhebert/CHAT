const fs = require("fs");
const https = require("https");

const envContent = fs.readFileSync(".env", "utf-8");

function extractApiKey(name) {
  const match = envContent.match(new RegExp(`${name}_API_KEY=(.+)`));
  return match ? match[1].trim() : null;
}

const keys = {
  GROQ: extractApiKey("GROQ"),
  DEEPSEEK: extractApiKey("DEEPSEEK"),
  ZENMUX: extractApiKey("ZENMUX"),
  ANTHROPIC: extractApiKey("ANTHROPIC"),
  OPENAI: extractApiKey("OPENAI"),
  GOOGLE: extractApiKey("GOOGLE_GENERATIVE_AI_API_KEY"),
  XAI: extractApiKey("XAI"),
  MISTRAL: extractApiKey("MISTRAL"),
};

const modelsToTest = [
  // Groq - more models
  { provider: "Groq", key: keys.GROQ, url: "api.groq.com", path: "/openai/v1/chat/completions", model: "llama-3.1-8b-instant", prompt: "Olá! Qual é o teu nome?" },
  { provider: "Groq", key: keys.GROQ, url: "api.groq.com", path: "/openai/v1/chat/completions", model: "gemma-7b-it", prompt: "Olá! Qual é o teu nome?" },
  { provider: "Groq", key: keys.GROQ, url: "api.groq.com", path: "/openai/v1/chat/completions", model: "whisper-large-v3", prompt: "Olá! Qual é o teu nome?" },
  
  // DeepSeek
  { provider: "DeepSeek", key: keys.DEEPSEEK, url: "api.deepseek.com", path: "/chat/completions", model: "deepseek-reasoner", prompt: "Olá! Qual é o teu nome?" },
  
  // Mistral
  { provider: "Mistral", key: keys.MISTRAL, url: "api.mistral.ai", path: "/v1/chat/completions", model: "mistral-small-latest", prompt: "Olá! Qual é o teu nome?" },
  { provider: "Mistral", key: keys.MISTRAL, url: "api.mistral.ai", path: "/v1/chat/completions", model: "open-mistral-7b", prompt: "Olá! Qual é o teu nome?" },
  
  // xAI (Grok)
  { provider: "xAI", key: keys.XAI, url: "api.x.ai", path: "/v1/chat/completions", model: "grok-beta", prompt: "Olá! Qual é o teu nome?" },
  
  // OpenAI
  { provider: "OpenAI", key: keys.OPENAI, url: "api.openai.com", path: "/v1/chat/completions", model: "gpt-4o-mini", prompt: "Olá! Qual é o teu nome?" },
  
  // Anthropic
  { provider: "Anthropic", key: keys.ANTHROPIC, url: "api.anthropic.com", path: "/v1/messages", model: "claude-haiku-3-20250514", prompt: "Olá! Qual é o teu nome?", isAnthropic: true },
  
  // Google
  { provider: "Google", key: keys.GOOGLE, url: "generativelanguage.googleapis.com", path: "/v1beta/models/gemini-1.5-flash:generateContent", prompt: "Olá! Qual é o teu nome?", isGoogle: true },
];

async function testModel(test) {
  if (!test.key || test.key === "") {
    return { status: "❌", response: "Sem API key" };
  }

  let postData, options;

  if (test.isAnthropic) {
    postData = JSON.stringify({
      model: test.model,
      max_tokens: 80,
      messages: [{ role: "user", content: test.prompt }],
    });
    options = {
      hostname: test.url,
      path: test.path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": test.key,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(postData),
      },
    };
  } else if (test.isGoogle) {
    postData = JSON.stringify({
      contents: [{ parts: [{ text: test.prompt }] }],
    });
    options = {
      hostname: test.url,
      path: `${test.path}?key=${test.key}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };
  } else {
    postData = JSON.stringify({
      model: test.model,
      messages: [{ role: "user", content: test.prompt }],
      max_tokens: 80,
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
          
          if (test.isAnthropic) {
            content = json.content?.[0]?.text || "";
          } else if (test.isGoogle) {
            content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
          } else {
            content = json.choices?.[0]?.message?.content || "";
          }
          
          if (json.error) {
            resolve({ status: "❌", response: (json.error.message || json.error).substring(0, 80) });
          } else if (content) {
            resolve({ status: "✅", response: content.substring(0, 100) });
          } else {
            resolve({ status: "❌", response: "Sem conteúdo na resposta" });
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
  console.log("🔹 TESTANDO MAIS MODELOS (GROQ, DEEPSEEK, MISTRAL, XAI, OPENAI, ANTHROPIC, GOOGLE)");
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
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("=" .repeat(70));
  console.log(`📊 Total: ${working} funcionando, ${failed} com problema`);
  console.log("=" .repeat(70));
}

runTests();
