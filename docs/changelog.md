# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-07-16

### 🔧 Fixed
- **Gemini API model names**: Updated deprecated `gemini-1.5-flash`/`gemini-1.5-pro` to `gemini-3.5-flash`/`gemini-2.5-pro`
- **Cross-platform model contamination**: `normalizeConversation` now validates model belongs to target platform
- **handleSend model validation**: Composer-passed model validated before API call
- **regenerateWith model validation**: "Reply with..." model now validated against platform

### ✨ Added
- NVIDIA Nemotron provider support
- Custom Models management in settings

### 📝 Documentation
- handoff.md, changelog.md, sprint-history.md, roadmap.md synced

## [1.0.0] - 2026-07-15

### 🔐 Security - Major Architecture Change
- **Removed master password mechanism** - Replaced with browser-bound random key encryption
- **New encryption architecture**: AES-GCM (256-bit) via Web Crypto API
- Keys generated per browser/profile via `crypto.subtle.generateKey()`
- Keys stored in localStorage (Base64 encoded raw key)
- Data automatically encrypted, zero user friction
- Device/browser change automatically invalidates encrypted data

### ✨ Added
- **Sprint 12**: API Key encryption migration to secureStorage
  - `useSecureLocalStorage` hook for async encrypted storage
  - `useApiKeys` migrated from `useLocalStorage` to `useSecureLocalStorage`
  - Automatic encryption of all API keys at rest
- **Sprint 11**: Complete Settings system
  - First-time Setup Wizard (4-step modal, now simplified to welcome screen)
  - Change Master Password component (deleted in v1.0.0)
  - Reset All Data component with confirmation
  - Password strength indicator (0-6 scoring)
- **Sprint 10**: Compare View
  - Multi-model parallel comparison grid
  - Streaming per model with "Pick Winner" action
  - Loading pulse animation
- **Sprint 9**: Core UX Features
  - "Reply with..." dropdown on assistant messages
  - Multi-AI Conversation (single thread, multiple models)
  - Conversation Routing (prefix/keyword/regex rules)
  - 9 default routing rules (@claude, @gpt, @gemini, /code, /write, /search)
- **Ollama Provider**: Local model support with streaming, model discovery, custom endpoint
- **LM Studio Provider**: OpenAI-compatible API, streaming, connection check
- **Browser Extension (MV3)**: Side Panel, Context Menus, MCP Client (SSE + STDIO)
- **Native Messaging Host**: Python host for MCP STDIO transport
- **MCP Tool Invocation Panel**: JSON param editor, smart result renderer

### 🔧 Changed
- **secureStorage.ts**: Complete rewrite - removed PBKDF2/master password, added Web Crypto key generation
- **useSecureLocalStorage.ts**: Removed password parameter, simplified to direct encryption
- **useApiKeys.ts**: Removed `reEncryptApiKeys`, simplified API
- **FirstTimeSetup.tsx**: 4-step password flow → single welcome screen
- **ResetAllData.tsx**: Removed password verification, direct confirmation input
- **App.tsx**: First-time check uses `aihub-first-time-setup` flag
- **Extension Side Panel**: Added LM Studio, MCP STDIO, Tool Panel, Compare View
- **GitHub Actions CI**: lint → typecheck → build → test pipeline

### 🗑️ Removed
- `src/components/ChangeMasterPassword.tsx` (deleted)
- `src/pages/Home.tsx` and empty `src/pages/` directory
- `aihub-master-password-set` localStorage key
- Master password UI from Settings page

### 🐛 Fixed
- **TypeScript config conflict** in FirstTimeSetup.tsx: `verbatimModuleSyntax` + `erasableSyntaxOnly` strict mode
  - Used `as const` for stepOrder array
  - Moved early return after declaration
  - Underscore prefix for unused params
- **ESLint exhaustive-deps** in Context providers: split into Provider + Context + Hook files
- **Vitest setup**: Removed localStorage mock, use real localStorage for tests
- **Chrome Web Store screenshots**: Regenerated after Settings UI changes

---

## [0.9.0] - 2026-07-14 (Sprint 8 Complete)

### ✨ Added
- AI Provider abstraction layer (`AIProvider` interface, Registry Pattern)
- Unified `generateAssistantReply()` entry point
- ChatGPT Provider: SSE streaming via `/v1/chat/completions`
- Claude Provider: SSE streaming with `anthropic-dangerous-direct-browser-access`
- Gemini Provider: JSON Lines streaming via `streamGenerateContent`
- Vite Dev Proxy for OpenAI CORS (`/api/openai` → `api.openai.com`)
- Model Map validation with official 2024 model names
- Browser Workflow: Copy Prompt → Open official site
- Project Management: CRUD, grouped display, move conversations

---

## [0.7.0] - 2026-07-13 (Sprint 7 Complete)

### ✨ Added
- Conversation CRUD (Create, Read, Update, Delete)
- Context Menu (Analyze, Summarize, Translate selected text)
- Favorite conversations
- Project grouping
- Export conversations (JSON)
- Conversation Search v2 (Title, Content, Platform, Project, Favorite)
- `createConversation(options)` + `createConversationByPlatform()`

---

## [0.6.0] - 2026-07-12

### ✨ Added
- Conversation Manager
- Prompt Library
- AI Agent Manager