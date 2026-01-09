const fs = require("fs");
const https = require("https");

const envContent = fs.readFileSync(".env", "utf-8");

function extractApiKey(name) {
  const match = envContent.match(new RegExp(`${name}_API_KEY=(.+)`));
  return match ? match[1].trim() : null;
}

const groqKey = extractApiKey("GROQ");
const googleKey = extractApiKey("GOOGLE_GENERATIVE_AI_API_KEY");

console.log("🔹 API Keys:");
console.log(`  Groq: ${groqKey ? "✅" : "❌"}`);
console.log(`  Google: ${googleKey ? "✅" : "❌"}`);
console.log("");

const modelsToTest = [
  // Groq - working models
  { provider: "Groq", key: groqKey, url: "api.groq.com", path: "/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", prompt: "Olá! Qual é o teu nome?" },
  { provider: "Groq", key: groqKey, url: "api.groq.com", path: "/openai/v1/chat/completions", model: "llama-3.1-8b-instant", prompt: "Olá! Qual é o teu nome?" },
  { provider: "Groq", key: groqKey, url: "api.groq.com", path: "/openai/v1/chat/completions", model: "llama-3.2-1b-preview", prompt: "Olá! Qual é o teu nome?" },
  { provider: "Groq", key: groqKey, url: "api.groq.com", path: "/openai/v1/chat/completions", model: "llama-3.2-3b-preview", prompt: "Olá! Qual é o teu nome?" },
  
  // Google Gemini
  { provider: "Google", key: googleKey, url: "generativelanguage.googleapis.com", path: "/v1beta/models/gemini-1.5-flash:generateContent", prompt: "Olá! Qual é o teu nome?", isGoogle: true },
  { provider: "Google", key: googleKey, url: "generativelanguage.googleapis.com", path: "/v1beta/models/gemini-1.5-pro:generateContent", prompt: "Olá! Qual é o teu nome?", isGoogle: true },
];

async function testModel(test) {
  if (!test.key || test.key === "") {
    return { status: "❌", response: "Sem API key" };
  }

  let postData, options;

  if (test.isGoogle) {
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
          
          if (test.isGoogle) {
            content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
          } else {
            content = json.choices?.[0]?.message?.content || "";
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
  console.log("🔹 TESTANDO MODELOS GROQ E GOOGLE GEMINI");
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
