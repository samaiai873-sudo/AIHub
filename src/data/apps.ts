export interface AIApp {
  id: string;
  name: string;
  url: string;
}

export const AI_APPS: AIApp[] = [
  {
    id: "chatgpt",
    name: "🤖 ChatGPT",
    url: "https://chatgpt.com",
  },
  {
    id: "claude",
    name: "🧠 Claude",
    url: "https://claude.ai",
  },
  {
    id: "gemini",
    name: "✨ Gemini",
    url: "https://gemini.google.com",
  },
  {
    id: "clawx",
    name: "⚡ ClawX",
    url: "http://127.0.0.1:18789",
  },
];