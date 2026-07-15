// AIHub Background Service Worker (MV3)
// Handles side panel, context menus, messaging

import { MCPClient } from "./mcp-client.js";

// State management
const STATE_KEY = "aihub-state";
let currentState = {
  activeProvider: "chatgpt",
  activeModel: "gpt-4o",
  apiKeys: {},
  mcpServers: [],
  isSidePanelOpen: false,
};

// Load persisted state
async function loadState() {
  const stored = await chrome.storage.local.get(STATE_KEY);
  if (stored[STATE_KEY]) {
    currentState = { ...currentState, ...stored[STATE_KEY] };
  }
  return currentState;
}

async function saveState() {
  await chrome.storage.local.set({ [STATE_KEY]: currentState });
}

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  await loadState();
  await initializeMCP();
});

chrome.runtime.onInstalled.addListener(async (details) => {
  await loadState();
  await initializeMCP();
  
  // Create context menu
  chrome.contextMenus.create({
    id: "aihub-analyze",
    title: "使用 AIHub 分析選取文字",
    contexts: ["selection"],
  });
  
  chrome.contextMenus.create({
    id: "aihub-summarize",
    title: "使用 AIHub 總結選取文字",
    contexts: ["selection"],
  });
  
  chrome.contextMenus.create({
    id: "aihub-translate",
    title: "使用 AIHub 翻譯選取文字",
    contexts: ["selection"],
  });
});

// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText) return;
  
  const action = info.menuItemId;
  await chrome.sidePanel.open({ tabId: tab.id });
  
  // Send action to side panel
  chrome.runtime.sendMessage({
    type: "CONTEXT_ACTION",
    action,
    text: info.selectionText,
    url: tab.url,
    title: tab.title,
  });
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-sidepanel") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  }
});

// Message passing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_STATE":
      sendResponse(currentState);
      break;
      
    case "SET_PROVIDER":
      currentState.activeProvider = message.provider;
      currentState.activeModel = message.model;
      saveState();
      sendResponse({ success: true });
      break;
      
    case "SET_API_KEY":
      currentState.apiKeys[message.provider] = message.key;
      saveState();
      sendResponse({ success: true });
      break;
      
    case "TOGGLE_SIDEPANEL":
      chrome.sidePanel.open({ tabId: sender.tab?.id });
      break;
      
    case "MCP_ADD_SERVER":
      currentState.mcpServers.push(message.server);
      saveState();
      initializeMCP();
      sendResponse({ success: true });
      break;
      
    case "MCP_REMOVE_SERVER":
      currentState.mcpServers = currentState.mcpServers.filter(
        s => s.id !== message.id
      );
      saveState();
      initializeMCP();
      sendResponse({ success: true });
      break;
      
    case "MCP_CALL_TOOL":
      callMCPTool(message.serverId, message.toolName, message.args)
        .then(sendResponse);
      return true; // async response
  }
  
  return true; // keep channel open for async responses
});

// Side panel state tracking
chrome.sidePanel.onOpen.addListener(() => {
  currentState.isSidePanelOpen = true;
});

chrome.sidePanel.onClose.addListener(() => {
  currentState.isSidePanelOpen = false;
});

// MCP Client integration (lazy loaded)
let mcpClient = null;

async function initializeMCP() {
  if (!currentState.mcpServers.length) return;
  
  try {
    const { MCPClient } = await import("./mcp-client.js");
    mcpClient = new MCPClient();
    
    for (const server of currentState.mcpServers) {
      await mcpClient.connect(server);
    }
  } catch (error) {
    console.error("MCP initialization failed:", error);
  }
}

async function callMCPTool(serverId, toolName, args) {
  if (!mcpClient) return { error: "MCP not initialized" };
  return mcpClient.callTool(serverId, toolName, args);
}