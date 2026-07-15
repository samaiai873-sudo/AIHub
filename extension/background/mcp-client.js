/**
 * MCP (Model Context Protocol) Client for AIHub
 * Supports both stdio and SSE transports
 */

export class MCPClient {
  constructor() {
    this.servers = new Map();
    this.tools = new Map();
  }

  async connect(server) {
    const { id, name, transport: transportType, config } = server;
    
    if (this.servers.has(id)) {
      await this.disconnect(id);
    }

    let transport;
    
    if (transportType === "stdio") {
      // For stdio transport, we'd need a native host or native messaging
      // This is a placeholder - actual stdio requires native messaging host
      throw new Error("stdio transport requires native messaging host");
    } else if (transportType === "sse") {
      // SSE transport for remote MCP servers
      transport = new SSETransport(config.url, config.headers);
    } else {
      throw new Error(`Unsupported transport: ${transport}`);
    }

    await transport.connect();
    
    // Initialize session
    const initResult = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        clientInfo: {
          name: "AIHub",
          version: "1.0.0",
        },
      },
    });

    // Get available tools
    const toolsResult = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });

    const serverInfo = {
      id,
      name,
      transport,
      tools: toolsResult.tools || [],
      initialized: true,
    };

    this.servers.set(id, serverInfo);
    
    // Cache tools
    for (const tool of serverInfo.tools) {
      this.tools.set(`${id}:${tool.name}`, {
        serverId: id,
        tool,
      });
    }

    return serverInfo;
  }

  async disconnect(id) {
    const server = this.servers.get(id);
    if (server?.transport) {
      await server.transport.close();
    }
    
    // Remove cached tools
    for (const tool of server?.tools || []) {
      this.tools.delete(`${id}:${tool.name}`);
    }
    
    this.servers.delete(id);
  }

  async callTool(serverId, toolName, args) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const toolKey = `${serverId}:${toolName}`;
    const toolInfo = this.tools.get(toolKey);
    if (!toolInfo) {
      throw new Error(`Tool ${toolName} not found on server ${serverId}`);
    }

    const result = await server.transport.sendRequest({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    });

    return result;
  }

  getAvailableTools() {
    return Array.from(this.tools.values()).map(({ serverId, tool }) => ({
      serverId,
      ...tool,
    }));
  }

  getServerStatus(id) {
    const server = this.servers.get(id);
    if (!server) return null;
    return {
      id: server.id,
      name: server.name,
      initialized: server.initialized,
      toolCount: server.tools.length,
    };
  }

  async listTools(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }
    return server.tools || [];
  }
}

class SSETransport {
  constructor(url, headers = {}) {
    this.url = url;
    this.headers = headers;
    this.eventSource = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(this.url, {
        headers: this.headers,
      });

      this.eventSource.onopen = () => resolve();
      this.eventSource.onerror = (err) => reject(err);
      
      this.eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error("Failed to parse SSE message:", e);
        }
      };
    });
  }

  handleMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
    }
  }

  async sendRequest(request) {
    const id = ++this.requestId;
    const requestWithId = { ...request, id };

    // For SSE, we POST to the server and wait for response via SSE
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify(requestWithId),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // For SSE, response comes via EventSource
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error("Request timeout"));
        }
      }, 30000);
    });
  }

  async close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.pendingRequests.clear();
  }
}