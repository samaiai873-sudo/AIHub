# Folder Structure

```
src/
├── components/               # UI 組件
│   ├── ConversationWorkspace.tsx
│   ├── ConversationSidebar.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   ├── Composer.tsx
│   ├── CompareView.tsx
│   ├── Sidebar.tsx
│   ├── PromptLibrary.tsx
│   ├── PromptList.tsx
│   ├── PromptCard.tsx
│   ├── PromptForm.tsx
│   ├── PromptToolbar.tsx
│   ├── CustomModels.tsx
│   ├── ProjectManager.tsx
│   ├── GlobalSearch.tsx
│   ├── DashboardStats.tsx
│   ├── FirstTimeSetup.tsx
│   ├── ResetAllData.tsx
│   ├── SearchBar.tsx
│   ├── EmptyState.tsx
│   └── AIAgentManager.tsx
├── context/                   # React Context
├── hooks/                     # Custom Hooks
├── providers/                 # AI Provider 抽象層
│   ├── chatgptProvider.ts
│   ├── claudeProvider.ts
│   ├── geminiProvider.ts
│   ├── grokProvider.ts
│   ├── localProvider.ts        # 合併 Ollama + LM Studio (OpenAI 相容 API)
│   ├── customProvider.ts
│   ├── registry.ts
│   ├── types.ts
│   ├── utils.ts
│   └── index.ts
├── constants/                 # 常數定義
│   ├── platforms.ts
│   ├── models.ts
│   └── routing.ts
├── data/                      # 靜態資料
│   └── aiPlatforms.ts
├── utils/                     # 工具函式
│   ├── secureStorage.ts
│   ├── conversationExport.ts
│   └── promptImportExport.ts
├── types/                     # TypeScript 型別
├── App.tsx                    # 主應用程式
└── main.tsx                   # 入口點

extension/                     # Chrome Extension (MV3)
├── background/                 # Service Worker
├── content/                   # Content Script
├── native-host/               # Python Native Messaging Host
└── src/sidepanel/             # Side Panel UI

docs/                          # 文件
├── handoff.md
├── changelog.md
├── sprint-history.md
├── roadmap.md
├── architecture.md
├── coding-style.md
├── provider-design.md
├── conversation-lifecycle.md
├── workspace-concept.md
├── folder-structure.md
├── api-design.md
├── comparison-report.md
└── privacy/
    ├── policy.md
    └── index.html
```
