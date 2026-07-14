import type { Platform } from "../constants/platforms";

export type Message = {
  id: string;

  // user/assistant：正常對話；system：像「尚未設定 API Key」這類提示；error：Provider 請求失敗
  role: "user" | "assistant" | "system" | "error";

  platform: string;

  model: string;

  content: string;

  createdAt: string;

  // Sprint 9: Reply with... — 正在重新生成時標記，用於 UI 顯示 loading 狀態
  regenerating?: boolean;

  // Sprint 9: Reply with... — 記錄原始模型，方便復原或顯示
  originalModel?: string;
};

export type Conversation = {
  id: string;

  title: string;

  messages: Message[];

  favorite: boolean;

  projectId: string | null;

  platform: Platform;

  model: string;

  createdAt: string;

  updatedAt: string;
};