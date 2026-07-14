import type { Platform } from "./platforms";

export type RoutingRule = {
  id: string;
  /** 優先級（數字越大越優先） */
  priority: number;
  /** 啟用狀態 */
  enabled: boolean;
  /** 匹配模式：關鍵字、正則、或指令前綴 */
  pattern: string;
  /** 模式類型 */
  patternType: "keyword" | "regex" | "prefix";
  /** 目標平台 */
  targetPlatform: Platform;
  /** 目標模型（可選，為空則使用該平台預設模型） */
  targetModel?: string;
  /** 描述 */
  description?: string;
};

/** 內建預設路由規則 */
export const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  {
    id: "route-claude-write",
    priority: 100,
    enabled: true,
    pattern: "@claude",
    patternType: "prefix",
    targetPlatform: "claude",
    targetModel: "sonnet-3.5",
    description: "以 @claude 開頭 → 導向 Claude 寫作",
  },
  {
    id: "route-gpt-code",
    priority: 100,
    enabled: true,
    pattern: "@gpt",
    patternType: "prefix",
    targetPlatform: "chatgpt",
    targetModel: "gpt-4o",
    description: "以 @gpt 開頭 → 導向 GPT-4o 程式/推理",
  },
  {
    id: "route-gemini-search",
    priority: 100,
    enabled: true,
    pattern: "@gemini",
    patternType: "prefix",
    targetPlatform: "gemini",
    targetModel: "gemini-1.5-pro",
    description: "以 @gemini 開頭 → 導向 Gemini 搜尋/長文本",
  },
  {
    id: "route-slash-code",
    priority: 90,
    enabled: true,
    pattern: "/code",
    patternType: "prefix",
    targetPlatform: "chatgpt",
    targetModel: "gpt-4o",
    description: "以 /code 開頭 → 導向 GPT-4o 寫代碼",
  },
  {
    id: "route-slash-write",
    priority: 90,
    enabled: true,
    pattern: "/write",
    patternType: "prefix",
    targetPlatform: "claude",
    targetModel: "sonnet-3.5",
    description: "以 /write 開頭 → 導向 Claude 寫作",
  },
  {
    id: "route-slash-search",
    priority: 90,
    enabled: true,
    pattern: "/search",
    patternType: "prefix",
    targetPlatform: "gemini",
    targetModel: "gemini-1.5-pro",
    description: "以 /search 開頭 → 導向 Gemini 搜尋",
  },
  {
    id: "route-keyword-code",
    priority: 50,
    enabled: true,
    pattern: "寫代碼|寫程式|code|programming|function|class|debug",
    patternType: "keyword",
    targetPlatform: "chatgpt",
    targetModel: "gpt-4o",
    description: "含程式關鍵字 → 導向 GPT-4o",
  },
  {
    id: "route-keyword-write",
    priority: 50,
    enabled: true,
    pattern: "寫文章|寫文案|copywriting|潤飾|改寫|摘要|總結",
    patternType: "keyword",
    targetPlatform: "claude",
    targetModel: "sonnet-3.5",
    description: "含寫作關鍵字 → 導向 Claude",
  },
  {
    id: "route-keyword-search",
    priority: 50,
    enabled: true,
    pattern: "搜尋|查詢|最新|新聞|current|latest|news|搜索",
    patternType: "keyword",
    targetPlatform: "gemini",
    targetModel: "gemini-1.5-pro",
    description: "含搜尋關鍵字 → 導向 Gemini",
  },
];

/** 匹配路由規則 */
export function matchRoutingRule(
  prompt: string,
  rules: RoutingRule[] = DEFAULT_ROUTING_RULES
): RoutingRule | null {
  const enabledRules = rules.filter((r) => r.enabled).sort((a, b) => b.priority - a.priority);

  for (const rule of enabledRules) {
    let matched = false;

    switch (rule.patternType) {
      case "prefix": {
        matched = prompt.trimStart().startsWith(rule.pattern);
        break;
      }
      case "keyword": {
        const keywords = rule.pattern.split("|");
        matched = keywords.some((kw) => prompt.toLowerCase().includes(kw.toLowerCase()));
        break;
      }
      case "regex": {
        try {
          matched = new RegExp(rule.pattern, "i").test(prompt);
        } catch {
          matched = false;
        }
        break;
      }
    }

    if (matched) {
      return rule;
    }
  }

  return null;
}

/** 移除路由前綴（@xxx、/xxx） */
export function stripRoutingPrefix(prompt: string, rule: RoutingRule): string {
  if (rule.patternType === "prefix") {
    return prompt.trimStart().slice(rule.pattern.length).trimStart();
  }
  return prompt;
}