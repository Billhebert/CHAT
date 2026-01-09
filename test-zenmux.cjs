const fs = require("fs");
const https = require("https");

const envContent = fs.readFileSync(".env", "utf-8");
const zenmuxMatch = envContent.match(/ZENMUX_API_KEY=(.+)/);
const ZENMUX_API_KEY = zenmuxMatch ? zenmuxMatch[1].trim() : null;

const freeModels = [
  "google/gemini-3-flash-preview-free",
  "xiaomi/mimo-v2-flash-free",
  "z-ai/glm-4.6v-flash-free",
];

async function testZenMuxFree() {
  if (!ZENMUX_API_KEY) {
    console.log("❌ ZENMUX_API_KEY não encontrada no .env");
    return;
  }

  for (const model of freeModels) {
    console.log(`\n🔹 Testando ${model}...`);

    const postData = JSON.stringify({
      model: model,
      messages: [
        {
          role: "user",
          content: "Olá! Qual é o teu nome? Responde só com o teu nome."
        }
      ],
      max_tokens: 50,
    });

    const options = {
      hostname: "zenmux.ai",
      path: "/api/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZENMUX_API_KEY}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    await new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              console.log(`❌ Erro: ${json.error.message}`);
            } else {
              const content = json.choices?.[0]?.message?.content || "Sem resposta";
              console.log(`✅ ${content}`);
            }
          } catch (e) {
            console.log(`❌ Erro: ${e.message}`);
          }
          resolve();
        });
      });

      req.on("error", (e) => {
        console.log(`❌ Erro: ${e.message}`);
        resolve();
      });
      req.write(postData);
      req.end();
    });

    await new Promise(r => setTimeout(r, 1000));
  }
}

testZenMuxFree();
