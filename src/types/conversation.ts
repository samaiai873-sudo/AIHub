export type Message = {
  id: string;

  role: "user" | "assistant";

  platform: string;

  model: string;

  content: string;

  createdAt: string;
};

export type Conversation = {
  id: string;

  title: string;

  messages: Message[];

  createdAt: string;

  updatedAt: string;
};