import { execSync } from "child_process";
import express from "express";

const CLI = "E:/app/OpenCode/opencode-cli.exe";

function runOpencode(prompt) {
  const out = execSync(`"${CLI}" run "${prompt.replace(/"/g, '\\"')}"`, {
    encoding: "utf-8",
    timeout: 60000,
  });
  return out.trim();
}

const app = express();
app.use(express.json());

app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message é obrigatório" });
  
  try {
    const response = runOpencode(message);
    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("API rodando em http://localhost:3000/api/chat");
});
