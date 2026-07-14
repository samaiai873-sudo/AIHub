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
      { id: "gpt-5", name: "GPT-5" },
      { id: "gpt-5-thinking", name: "GPT-5 Thinking" },
      { id: "gpt-4.1", name: "GPT-4.1" },
    ],
  },
  {
    id: "claude",
    name: "Claude",
    icon: "🟣",
    url: "https://claude.ai",
    models: [
      { id: "sonnet-4", name: "Sonnet 4" },
      { id: "opus-4", name: "Opus 4" },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "💎",
    url: "https://gemini.google.com",
    models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
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
];