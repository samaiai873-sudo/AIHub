import useLocalStorage from "./useLocalStorage";
import type { Platform } from "../constants/platforms";

export type WorkspaceSettings = {
  showSearchPreview: boolean;
  groupByProject: boolean;
  /** 最後一次實際使用（Send 或 Open in Browser）的 AI Platform，用來當新 Conversation 的預設值 */
  lastUsedPlatform: Platform | null;
};

const defaultSettings: WorkspaceSettings = {
  showSearchPreview: true,
  groupByProject: true,
  lastUsedPlatform: null,
};

export default function useAppSettings() {
  const [settings, setSettings] = useLocalStorage<WorkspaceSettings>(
    "aihub-settings",
    defaultSettings
  );

  const updateSettings = (updates: Partial<WorkspaceSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const setLastUsedPlatform = (platform: Platform) => {
    updateSettings({ lastUsedPlatform: platform });
  };

  return {
    settings,
    updateSettings,
    setLastUsedPlatform,
  };
}
