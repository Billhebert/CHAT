const { spawn } = require("child_process");

const cli = "E:/app/OpenCode/opencode-cli.exe";
const message = process.argv[2] || "Olá!";

console.log("Enviando:", message);

const proc = spawn(cli, ["run", message], { stdio: "pipe" });

let out = "";
let err = "";

proc.stdout.on("data", (d) => out += d.toString());
proc.stderr.on("data", (d) => err += d.toString());

proc.on("close", (code) => {
  console.log("Código:", code);
  console.log("Saída:", out);
  if (err) console.log("Erro:", err);
});
