export type AIProvider =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "clawx"
  | "all";

export interface Prompt {
  id: string;
  title: string;
  content: string;
  provider: AIProvider;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}