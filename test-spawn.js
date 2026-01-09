import { spawn } from "child_process";

const OPENCODE_CLI = "E:/app/OpenCode/opencode-cli.exe";

async function test() {
  console.log("🔍 Testing CLI spawn...\n");
  
  const prompt = "Hello! How are you?";
  
  console.log(`📤 Running: ${OPENCODE_CLI} run "${prompt}" --model opencode/minimax-m2.1-free`);
  
  const child = spawn(`"${OPENCODE_CLI}" run "${prompt}" --model opencode/minimax-m2.1-free`, {
    shell: true,
    stdio: ["pipe", "pipe", "pipe"]
  });

  let stdout = "";
  let stderr = "";

  const timeout = setTimeout(() => {
    console.log("⏰ Timeout! Killing process...");
    child.kill();
  }, 30000);

  child.stdout.on("data", (data) => {
    const text = data.toString();
    stdout += text;
    process.stdout.write(text);
  });

  child.stderr.on("data", (data) => {
    const text = data.toString();
    stderr += text;
    process.stderr.write(text);
  });

  child.on("close", (code) => {
    clearTimeout(timeout);
    console.log(`\n🏁 Process exited with code ${code}`);
  });

  child.on("error", (err) => {
    clearTimeout(timeout);
    console.error("❌ Error:", err.message);
  });
}

test();
