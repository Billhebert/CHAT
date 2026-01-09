import { spawn } from "child_process";
import readline from "readline";

const OPENCODE_CLI = process.env.OPENCODE_CLI || "E:/app/OpenCode/opencode-cli.exe";

function runOpencode(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(OPENCODE_CLI, ["run", prompt], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Exit code ${code}: ${stderr}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function chat() {
  console.clear();
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║       🤖 Opencode CLI Chat Wrapper             ║");
  console.log("╚════════════════════════════════════════════════╝\n");
  console.log("CLI:", OPENCODE_CLI);
  console.log("Digite 'sair' para encerrar\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = () => {
    rl.question("👤 Você: ", async (prompt) => {
      if (!prompt.trim()) {
        ask();
        return;
      }

      if (prompt.toLowerCase() === "sair" || prompt.toLowerCase() === "exit") {
        console.log("\n👋 Encerrado!");
        rl.close();
        process.exit(0);
      }

      console.log("\n⏳ Processando...\n");

      try {
        const response = await runOpencode(prompt);
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
}

if (process.argv[2]) {
  const prompt = process.argv.slice(2).join(" ");
  runOpencode(prompt)
    .then(console.log)
    .catch(console.error)
    .finally(() => process.exit(0));
} else {
  chat();
}
