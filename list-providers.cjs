const fs = require("fs");

const data = JSON.parse(fs.readFileSync("models.json", "utf-8"));

console.log("=" * 60);
console.log("PROVIDERS E API KEYS NECESSÁRIAS");
console.log("=" * 60);
console.log();

const providersWithKeys = [];
const providersWithoutKeys = [];

for (const [providerId, providerData] of Object.entries(data)) {
  const name = providerData.name || providerId;
  const envVars = providerData.env || [];
  
  if (envVars.length > 0) {
    providersWithKeys.push({ id: providerId, name, env: envVars });
  } else {
    providersWithoutKeys.push({ id: providerId, name });
  }
}

console.log("📋 PROVEDORES QUE PRECISAM DE API KEY:");
console.log("-".repeat(60));
for (const p of providersWithKeys.sort((a, b) => a.id.localeCompare(b.id))) {
  console.log(`\n🔑 ${p.id}`);
  console.log(`   Nome: ${p.name}`);
  for (const env of p.env) {
    console.log(`   Variável: ${env}`);
  }
}

console.log();
console.log("=".repeat(60));
console.log("📋 PROVEDORES QUE NÃO PRECISAM DE API KEY:");
console.log("-".repeat(60));
for (const p of providersWithoutKeys.sort((a, b) => a.id.localeCompare(b.id))) {
  console.log(`  • ${p.id} (${p.name})`);
}

console.log();
console.log("=".repeat(60));
console.log(`Total: ${providersWithKeys.length} com API key, ${providersWithoutKeys.length} sem API key`);
