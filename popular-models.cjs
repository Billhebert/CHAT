const fs = require("fs");

const data = JSON.parse(fs.readFileSync("models.json", "utf-8"));

const popularModels = [
  { provider: "openai", models: ["gpt-4o", "gpt-4o-mini", "o1-preview", "o1-mini", "gpt-4-turbo"] },
  { provider: "anthropic", models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-3-20250514"] },
  { provider: "google", models: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"] },
  { provider: "github-copilot", models: ["gpt-4o", "claude-sonnet-4.5", "gemini-3-flash-preview"] },
  { provider: "groq", models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma-7b-it"] },
  { provider: "deepseek", models: ["deepseek-chat", "deepseek-reasoner"] },
  { provider: "mistral", models: ["mistral-large-latest", "mistral-small-latest", "open-mistral-7b"] },
  { provider: "togetherai", models: ["Llama-3.3-70B-Instruct-Turbo", "Qwen-2.5-72B-Instruct", "DeepSeek-V3"] },
  { provider: "openrouter", models: ["openai/gpt-4o", "anthropic/claude-sonnet-4", "google/gemini-2.0-flash-exp"] },
  { provider: "huggingface", models: ["HuggingFaceH4/zephyr-7b-beta", "meta-llama/Llama-3.3-70B-Instruct"] },
  { provider: "cerebras", models: ["llama-3.3-70b-instruct", "qwen-2.5-72b-instruct"] },
  { provider: "xai", models: ["grok-beta"] },
  { provider: "perplexity", models: ["sonar-pro", "sonar-small-online"] },
  { provider: "fireworks-ai", models: ["llama-v3p1-405b-instruct", "accounts/fireworks/models/llama-v3-70b-instruct"] },
  { provider: "venice-ai", models: ["venice-uncensored", "llama-3.1-8b"] },
  { provider: "nvidia", models: ["nvidia/llama-3.1-nemotron-70b-instruct"] },
  { provider: "cohere", models: ["command-r-plus", "command-r"] },
  { provider: "upstage", models: ["solar-pro", "solar-mini"] },
  { provider: "siliconflow", models: ["Qwen/Qwen2.5-72B-Instruct", "01-ai/Yi-34B-Chat"] },
  { provider: "cloudflare-workers-ai", models: ["@cf/meta/llama-3-8b-instruct", "@cf/meta/llama-3-70b-instruct", "@cf/black-forest-labs/flux-1-schnell"] },
  { provider: "ollama-cloud", models: ["llama3.1", "qwen2.5", "mistral"] },
  { provider: "minimax", models: ["abab6.5s-chat", "abab6.5-chat"] },
  { provider: "moonshotai-cn", models: ["kimi-k2-thinking-turbo", "kimi-k2-thinking"] },
  { provider: "zhipuai", models: ["glm-4-plus", "glm-4-alltools"] },
  { provider: "alibaba", models: ["qwen-turbo", "qwen-plus", "qwen-max"] },
  { provider: "lmstudio", models: ["llama-3-8b-instruct", "mistral-7b-instruct"] },
  { provider: "zenmux", models: ["google-gemini-3-flash-preview-free"] },
  { provider: "aihubmix", models: ["coding-glm-4.7-free"] },
  { provider: "opencode", models: ["big-pickle", "minimax-m2.1-free"] },
];

console.log("=" * 70);
console.log("📊 MODELOS MAIS POPULARES POR PROVIDER");
console.log("=" * 70);
console.log();

for (const p of popularModels) {
  const providerData = data[p.provider];
  if (!providerData) continue;
  
  const name = providerData.name || p.provider;
  const envVars = providerData.env || [];
  const envDisplay = envVars.length > 0 ? ` [${envVars[0]}]` : "";
  
  console.log(`🔹 ${name}${envDisplay}`);
  console.log(`   Modelos: ${p.models.join(", ")}`);
  console.log();
}

console.log("=" * 70);
