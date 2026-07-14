import useLocalStorage from "./useLocalStorage";
import type { Platform } from "../constants/platforms";
import type { RoutingRule } from "../constants/routing";
import { DEFAULT_ROUTING_RULES } from "../constants/routing";

export type WorkspaceSettings = {
  showSearchPreview: boolean;
  groupByProject: boolean;
  /** 最後一次實際使用（Send 或 Open in Browser）的 AI Platform，用來當新 Conversation 的預設值 */
  lastUsedPlatform: Platform | null;
  /** Sprint 9: Conversation Routing 規則 */
  routingRules: RoutingRule[];
};

const defaultSettings: WorkspaceSettings = {
  showSearchPreview: true,
  groupByProject: true,
  lastUsedPlatform: null,
  routingRules: DEFAULT_ROUTING_RULES,
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

  // Sprint 9: Routing Rules 管理
  const updateRoutingRules = (rules: RoutingRule[]) => {
    updateSettings({ routingRules: rules });
  };

  const addRoutingRule = (rule: RoutingRule) => {
    updateSettings({ routingRules: [...settings.routingRules, rule] });
  };

  const removeRoutingRule = (ruleId: string) => {
    updateSettings({
      routingRules: settings.routingRules.filter((r) => r.id !== ruleId),
    });
  };

  const toggleRoutingRule = (ruleId: string) => {
    updateSettings({
      routingRules: settings.routingRules.map((r) =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ),
    });
  };

  return {
    settings,
    updateSettings,
    setLastUsedPlatform,
    updateRoutingRules,
    addRoutingRule,
    removeRoutingRule,
    toggleRoutingRule,
  };
}
