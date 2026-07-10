export type AIModel = {
  id: string;
  name: string;
};

export type AIPlatform = {
  id: string;
  name: string;
  icon: string;
  models: AIModel[];
};

export const aiPlatforms: AIPlatform[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "🤖",
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
    models: [
      { id: "sonnet-4", name: "Sonnet 4" },
      { id: "opus-4", name: "Opus 4" },
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: "💎",
    models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    ],
  },
  {
    id: "grok",
    name: "Grok",
    icon: "🚀",
    models: [
      { id: "grok-4", name: "Grok 4" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🐋",
    models: [
      { id: "deepseek-v3", name: "DeepSeek V3" },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "🔍",
    models: [
      { id: "sonar", name: "Sonar" },
    ],
  },
];