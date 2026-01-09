const fs = require("fs");
const https = require("https");

const envContent = fs.readFileSync(".env", "utf-8");
const zenmuxMatch = envContent.match(/ZENMUX_API_KEY=(.+)/);
const ZENMUX_API_KEY = zenmuxMatch ? zenmuxMatch[1].trim() : null;

async function testZenMuxFree() {
  if (!ZENMUX_API_KEY) {
    console.log("❌ ZENMUX_API_KEY não encontrada no .env");
    return;
  }

  console.log("🔹 Testando ZenMux Google Gemini 3 Flash Preview Free...");
  console.log("");

  const postData = JSON.stringify({
    model: "google/gemini-3-flash-preview-free",
    messages: [
      {
        role: "user",
        content: "Olá! Qual é o teu nome? Responde só com o teu nome."
      }
    ],
    max_tokens: 50,
  });

  const options = {
    hostname: "api.zenmux.com",
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ZENMUX_API_KEY}`,
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        if (json.error) {
          console.log("❌ Erro:", json.error.message);
        } else {
          const content = json.choices?.[0]?.message?.content || "Sem resposta";
          console.log("✅ Resposta:", content);
          console.log("📊 Modelo:", json.model || "google/gemini-3-flash-preview-free");
        }
      } catch (e) {
        console.log("❌ Erro ao parsear resposta:", e.message);
        console.log("Raw data:", data);
      }
    });
  });

  req.on("error", (e) => console.log("❌ Erro na requisição:", e.message));
  req.write(postData);
  req.end();
}

testZenMuxFree();
