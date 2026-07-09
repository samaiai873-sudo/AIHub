export type Provider = {
  id: string;
  name: string;
};

export const providers: Provider[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
  },
  {
    id: "claude",
    name: "Claude",
  },
  {
    id: "gemini",
    name: "Gemini",
  },
  {
    id: "grok",
    name: "Grok",
  },
  {
    id: "perplexity",
    name: "Perplexity",
  },
];