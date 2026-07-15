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
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
      { id: "gemini-1.0-pro", name: "Gemini 1.0 Pro" },
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
];