export type AIPlatform = {
  id: string;
  name: string;
  icon: string;
  models: string[];
};

export const aiPlatforms: AIPlatform[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "🤖",
    models: [
      "GPT-5",
      "GPT-5 Thinking",
      "GPT-4.1",
      "GPT-4o",
    ],
  },
  {
    id: "claude",
    name: "Claude",
    icon: "🟣",
    models: [
      "Claude Sonnet 4",
      "Claude Opus 4",
      "Claude Haiku 4",
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: "💎",
    models: [
      "Gemini 2.5 Pro",
      "Gemini 2.5 Flash",
    ],
  },
  {
    id: "grok",
    name: "Grok",
    icon: "🚀",
    models: [
      "Grok 4",
      "Grok 4 Heavy",
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🔵",
    models: [
      "DeepSeek R1",
      "DeepSeek V3",
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "🔍",
    models: [
      "Sonar",
      "Sonar Pro",
    ],
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    icon: "🪟",
    models: [
      "Copilot",
      "Copilot Pro",
    ],
  },
  {
    id: "qwen",
    name: "Qwen",
    icon: "🟠",
    models: [
      "Qwen3",
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    icon: "🌪️",
    models: [
      "Mistral Large",
      "Magistral",
    ],
  },
];