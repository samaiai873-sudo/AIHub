export type AIModel = {
  id: string;
  name: string;
};

export type AIPlatform = {
  id: string;
  name: string;
  icon: string;
  url: string;
  models: AIModel[];
};

export const aiPlatforms: AIPlatform[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "🤖",
    url: "https://chatgpt.com",
    models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    ],
  },
  {
    id: "claude",
    name: "Claude",
    icon: "🟣",
    url: "https://claude.ai",
    models: [
      { id: "sonnet-3.5", name: "Sonnet 3.5" },
      { id: "haiku-3.5", name: "Haiku 3.5" },
      { id: "opus-3", name: "Opus 3" },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "💎",
    url: "https://gemini.google.com",
    models: [
      { id: "gemini-flash-latest", name: "Gemini 3.5 Flash (Latest)" },
      { id: "gemini-pro-latest", name: "Gemini 3.1 Pro (Latest)" },
      { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
      { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro" },
      { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "🌊",
    url: "https://www.perplexity.ai",
    models: [
      { id: "sonar", name: "Sonar" },
    ],
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    icon: "🧠",
    url: "https://copilot.microsoft.com",
    models: [
      { id: "copilot", name: "Copilot" },
    ],
  },
  {
    id: "grok",
    name: "Grok",
    icon: "🚀",
    url: "https://x.com/grok",
    models: [
      { id: "grok-4", name: "Grok 4" },
    ],
  },
  {
    id: "ollama",
    name: "Ollama (本地)",
    icon: "🦙",
    url: "http://localhost:11434",
    models: [
      { id: "llama3.1", name: "Llama 3.1" },
      { id: "llama3.2", name: "Llama 3.2" },
      { id: "qwen2.5", name: "Qwen 2.5" },
      { id: "mistral", name: "Mistral" },
      { id: "codellama", name: "Code Llama" },
    ],
  },
  {
    id: "lmstudio",
    name: "LM Studio (本地)",
    icon: "🧪",
    url: "http://localhost:1234",
    models: [
      { id: "local-model", name: "本地載入模型" },
    ],
  },
  {
    id: "nvidia",
    name: "NVIDIA Nemotron",
    icon: "🟢",
    url: "https://build.nvidia.com",
    models: [
      { id: "nemotron-3-ultra", name: "Nemotron 3 Ultra (53B)" },
      { id: "nemotron-4-340b", name: "Nemotron 4 340B" },
      { id: "nemotron-3-8b", name: "Nemotron 3 Ultra 8B" },
    ],
  },
];