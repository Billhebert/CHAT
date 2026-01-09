// main.js (ESM)
import { createOpencode } from "@opencode-ai/sdk";

function listKeys(obj, name) {
  if (!obj) {
    console.log(`🔎 ${name}: (undefined)`);
    return;
  }
  const keys = Object.keys(obj).sort();
  console.log(`🔎 ${name} keys:\n  - ${keys.join("\n  - ")}\n`);
}

async function safeClose(opencode) {
  try {
    await opencode.server.close();
  } catch {}
}

const opencode = await createOpencode({
  hostname: "127.0.0.1",
  port: 4096,
  config: {
    model: "opencode/minimax-m2.1-free",
  },
});

console.log(`✅ Server running at ${opencode.server.url}`);

process.on("SIGINT", async () => {
  console.log("\n🛑 Encerrando servidor...");
  await safeClose(opencode);
  console.log("✅ Servidor encerrado.");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Encerrando servidor (SIGTERM)...");
  await safeClose(opencode);
  console.log("✅ Servidor encerrado.");
  process.exit(0);
});

async function main() {
  const client = opencode.client;
  // 1) Mostra o que existe no client (pra bater com seu autocomplete)
  listKeys(client, "client");
  listKeys(client.global, "client.global");
  listKeys(client.session, "client.session");
  // 2) Tenta criar sessão (conforme você já viu que existe "session")
  let sessionId = null;
  // Tentativa A: session.create({ body: { title } })
  if (typeof client.session?.create === "function") {
    const res = await client.session.create({ body: { title: "testeIA" } });
    sessionId = res?.data?.id ?? res?.id;
  }
  if (!sessionId) {
    throw new Error(
      "Não consegui criar session. Me diga quais métodos aparecem em client.session (o log acima) que eu ajusto certinho."
    );
  }
  console.log(`🧩 Session criada: ${sessionId}`);
  // 3) Enviar prompt — tenta alguns formatos comuns
  const textPrompt = "Olá! Responda com uma frase curta."; // Tentativa 1: session.prompt({ path: { id }, body: { parts } })
  if (typeof client.session?.prompt === "function") {
    const r = await client.session.prompt({
      path: { id: sessionId },
      body: { parts: [{ type: "text", text: textPrompt }] },
    });
    const out =
      r?.data?.parts?.find((p) => p.type === "text")?.text ??
      r?.data?.text ??
      JSON.stringify(r?.data ?? r, null, 2);
    console.log("\n💬 Resposta do modelo:\n" + out);
    console.log("\nℹ️ Pressione Ctrl+C para encerrar.");
    await new Promise(() => {});
    return;
  }
  // Tentativa 2: session.message.create(...) (alguns SDKs usam message)
  if (
    client.session?.message &&
    typeof client.session.message.create === "function"
  ) {
    const r = await client.session.message.create({
      path: { id: sessionId },
      body: { role: "user", content: textPrompt },
    });
    console.log("\n💬 Retorno:\n" + JSON.stringify(r?.data ?? r, null, 2));
    console.log("\nℹ️ Pressione Ctrl+C para encerrar.");
    await new Promise(() => {});
    return;
  }
  throw new Error(
    "Não encontrei client.session.prompt nem client.session.message.create. Veja o log de keys e me mande (ou printa) quais métodos existem em client.session."
  );
}
main().catch(async (err) => {
  console.error("❌ Erro no main():", err);
  console.log("\n🛑 Encerrando servidor...");
  await safeClose(opencode);
  console.log("✅ Servidor encerrado.");
  process.exit(1);
});
