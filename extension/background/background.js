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
      
    case "MCP_UPDATE_SERVER":
      currentState.mcpServers = currentState.mcpServers.map(s => 
        s.id === message.id ? message.server : s
      );
      saveState();
      initializeMCP();
      sendResponse({ success: true });
      break;
      
    case "MCP_TEST_CONNECTION":
      testMCPConnection(message.server)
        .then(sendResponse);
      return true; // async response
      
    case "MCP_CALL_TOOL":
      callMCPTool(message.serverId, message.toolName, message.args)
        .then(sendResponse);
      return true; // async response

    case "MCP_START_STDIO":
      startStdioMCPServer(message.serverId, message.config)
        .then(sendResponse);
      return true; // async response

    case "MCP_STOP_STDIO":
      stopStdioMCPServer(message.serverId)
        .then(sendResponse);
      return true; // async response

    case "MCP_STDIO_REQUEST":
      sendStdioMCPRequest(message.serverId, message.request)
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

async function testMCPConnection(server) {
  if (!mcpClient) return { error: "MCP not initialized" };
  
  try {
    // Try to connect to the server
    await mcpClient.connect(server);
    
    // Get available tools
    const tools = await mcpClient.listTools(server.id);
    
    return { 
      success: true, 
      toolsCount: tools.length,
      tools: tools.map(t => ({ name: t.name, description: t.description }))
    };
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// STDIO Native Messaging Host management
const NATIVE_HOST_NAME = "com.aihub.native";
let stdioPort = null;
const stdioServers = new Map(); // serverId -> { config, tools }

async function connectStdioHost() {
  if (stdioPort) return stdioPort;
  
  try {
    stdioPort = chrome.runtime.connectNative(NATIVE_HOST_NAME);
    
    stdioPort.onMessage.addListener((message) => {
      if (message.type === "mcp_notification") {
        // Forward notification to side panel
        chrome.runtime.sendMessage({
          type: "MCP_NOTIFICATION",
          serverId: message.server_id,
          data: message.data
        });
      } else if (message.type === "mcp_server_stopped") {
        // Server process ended
        stdioServers.delete(message.server_id);
        chrome.runtime.sendMessage({
          type: "MCP_SERVER_STOPPED",
          serverId: message.server_id
        });
      } else if (message.type === "mcp_server_log") {
        // Server log output
        chrome.runtime.sendMessage({
          type: "MCP_SERVER_LOG",
          serverId: message.server_id,
          level: message.level,
          message: message.message
        });
      }
    });
    
    stdioPort.onDisconnect.addListener(() => {
      stdioPort = null;
      console.log("Native messaging host disconnected");
    });
    
    return stdioPort;
  } catch (error) {
    console.error("Failed to connect to native host:", error);
    throw new Error(`無法連線到 Native Messaging Host: ${error.message}`);
  }
}

async function startStdioMCPServer(serverId, config) {
  const port = await connectStdioHost();
  
  return new Promise((resolve) => {
    const requestId = Date.now().toString();
    
    const handleResponse = (response) => {
      if (response.id === requestId) {
        chrome.runtime.onMessage.removeListener(listener);
        resolve(response.data);
      }
    };
    
    const listener = (message, sender, sendResponse) => {
      if (message.type === "response" && message.id === requestId) {
        handleResponse(message);
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    
    port.postMessage({
      id: requestId,
      type: "mcp_start",
      server_id: serverId,
      config: config
    });
  });
}

async function stopStdioMCPServer(serverId) {
  const port = await connectStdioHost();
  
  return new Promise((resolve) => {
    const requestId = Date.now().toString();
    
    const listener = (message, sender, sendResponse) => {
      if (message.type === "response" && message.id === requestId) {
        chrome.runtime.onMessage.removeListener(listener);
        stdioServers.delete(serverId);
        resolve(message.data);
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    
    port.postMessage({
      id: requestId,
      type: "mcp_stop",
      server_id: serverId
    });
  });
}

async function sendStdioMCPRequest(serverId, request) {
  const port = await connectStdioHost();
  
  return new Promise((resolve) => {
    const requestId = Date.now().toString();
    
    const listener = (message, sender, sendResponse) => {
      if (message.type === "response" && message.id === requestId) {
        chrome.runtime.onMessage.removeListener(listener);
        resolve(message.data);
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    
    port.postMessage({
      id: requestId,
      type: "mcp_request",
      server_id: serverId,
      request: request
    });
  });
}