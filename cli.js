import { execSync } from "child_process";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = process.env.OPENCODE_CLI || "E:/app/OpenCode/opencode-cli.exe";

function run(prompt) {
  try {
    const out = execSync(`"${CLI}" run "${prompt.replace(/"/g, '\\"')}"`, {
      cwd: __dirname,
      encoding: "utf-8",
      timeout: 60000,
    });
    return out.trim();
  } catch (err) {
    throw new Error(err.stdout || err.message);
  }
}

const args = process.argv.slice(2).join(" ");

if (args) {
  console.log("⏳ Processando...\n");
  try {
    const response = run(args);
    console.log("🤖 Opencode:");
    console.log(response);
  } catch (err) {
    console.error("❌ Erro:", err.message);
  }
  process.exit(0);
}

console.clear();
console.log("╔════════════════════════════════════════════════╗");
console.log("║          🤖 Opencode CLI Chat                  ║");
console.log("╚════════════════════════════════════════════════╝\n");
console.log("💡 Digite 'sair' para encerrar\n");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = () => {
  rl.question("👤 Você: ", (prompt) => {
    if (!prompt.trim()) {
      ask();
      return;
    }

    if (prompt.toLowerCase() === "sair") {
      console.log("\n👋 Encerrado!");
      rl.close();
      process.exit(0);
    }

    console.log("\n⏳ Processando...\n");

    try {
      const response = run(prompt);
      console.log("🤖 Opencode:");
      console.log(response);
      console.log("");
    } catch (err) {
      console.error("❌ Erro:", err.message);
      console.log("");
    }

    ask();
  });
};

ask();
