#!/usr/bin/env python3
"""
AIHub Native Messaging Host for MCP STDIO Transport

This script acts as a bridge between the Chrome Extension and local MCP servers
that communicate via stdio (stdin/stdout).

Protocol: Chrome Native Messaging
- Messages are length-prefixed JSON (4 bytes little-endian length + JSON)
- stdin: receives messages from Chrome
- stdout: sends messages to Chrome

MCP Protocol: JSON-RPC 2.0 over stdio
"""

import sys
import json
import struct
import subprocess
import threading
import queue
import os
import signal
import time
from typing import Dict, Any, Optional, List

class NativeMessagingHost:
    def __init__(self):
        self.processes: Dict[str, subprocess.Popen] = {}
        self.request_id = 0
        self.pending_requests: Dict[int, queue.Queue] = {}
        self.running = True
        self.lock = threading.Lock()
        
    def send_message(self, message: Dict[str, Any]) -> None:
        """Send a message to Chrome via stdout"""
        encoded = json.dumps(message).encode('utf-8')
        sys.stdout.buffer.write(struct.pack('<I', len(encoded)))
        sys.stdout.buffer.write(encoded)
        sys.stdout.buffer.flush()
    
    def read_message(self) -> Optional[Dict[str, Any]]:
        """Read a message from Chrome via stdin"""
        try:
            # Read message length (4 bytes little-endian)
            length_bytes = sys.stdin.buffer.read(4)
            if len(length_bytes) < 4:
                return None
            
            length = struct.unpack('<I', length_bytes)[0]
            if length > 1024 * 1024:  # 1MB max
                return None
            
            # Read message body
            message_bytes = sys.stdin.buffer.read(length)
            if len(message_bytes) < length:
                return None
            
            return json.loads(message_bytes.decode('utf-8'))
        except (struct.error, json.JSONDecodeError, OSError):
            return None
    
    def start_mcp_server(self, server_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Start an MCP server process"""
        try:
            command = config.get('command', '')
            args = config.get('args', [])
            env = config.get('env', {})
            cwd = config.get('cwd', os.getcwd())
            
            if not command:
                return {"error": "No command specified"}
            
            # Prepare environment
            full_env = os.environ.copy()
            full_env.update(env)
            
            # Start the process
            proc = subprocess.Popen(
                [command] + args,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=full_env,
                cwd=cwd,
                bufsize=0  # Unbuffered
            )
            
            with self.lock:
                self.processes[server_id] = proc
            
            # Start reader threads
            threading.Thread(target=self._read_stdout, args=(server_id, proc), daemon=True).start()
            threading.Thread(target=self._read_stderr, args=(server_id, proc), daemon=True).start()
            
            # Initialize MCP session
            init_request = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "clientInfo": {
                        "name": "AIHub",
                        "version": "1.0.0"
                    }
                }
            }
            
            self._send_to_process(server_id, init_request)
            
            # Wait for initialize response
            time.sleep(0.5)
            
            # Get available tools
            tools_request = {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/list",
                "params": {}
            }
            self._send_to_process(server_id, tools_request)
            
            return {"success": True, "message": f"MCP server {server_id} started"}
            
        except Exception as e:
            return {"error": f"Failed to start MCP server: {str(e)}"}
    
    def stop_mcp_server(self, server_id: str) -> Dict[str, Any]:
        """Stop an MCP server process"""
        with self.lock:
            proc = self.processes.pop(server_id, None)
        
        if proc:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
            return {"success": True, "message": f"MCP server {server_id} stopped"}
        else:
            return {"error": f"Server {server_id} not found"}
    
    def send_mcp_request(self, server_id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Send an MCP request to a server"""
        with self.lock:
            proc = self.processes.get(server_id)
        
        if not proc:
            return {"error": f"Server {server_id} not running"}
        
        if proc.poll() is not None:
            with self.lock:
                self.processes.pop(server_id, None)
            return {"error": f"Server {server_id} has stopped"}
        
        # Generate request ID
        with self.lock:
            self.request_id += 1
            request_id = self.request_id
        
        request_with_id = {**request, "id": request_id}
        
        # Create response queue
        response_queue = queue.Queue()
        with self.lock:
            self.pending_requests[request_id] = response_queue
        
        # Send request
        self._send_to_process(server_id, request_with_id)
        
        # Wait for response (with timeout)
        try:
            response = response_queue.get(timeout=30)
            return response
        except queue.Empty:
            with self.lock:
                self.pending_requests.pop(request_id, None)
            return {"error": "Request timeout"}
        finally:
            with self.lock:
                self.pending_requests.pop(request_id, None)
    
    def _send_to_process(self, server_id: str, message: Dict[str, Any]) -> None:
        """Send a message to an MCP server process"""
        with self.lock:
            proc = self.processes.get(server_id)
        
        if proc and proc.stdin:
            try:
                encoded = (json.dumps(message) + '\n').encode('utf-8')
                proc.stdin.write(encoded)
                proc.stdin.flush()
            except (BrokenPipeError, OSError):
                pass
    
    def _read_stdout(self, server_id: str, proc: subprocess.Popen) -> None:
        """Read stdout from MCP server process"""
        while self.running and proc.poll() is None:
            try:
                line = proc.stdout.readline()
                if not line:
                    break
                
                line = line.decode('utf-8').strip()
                if not line:
                    continue
                
                try:
                    message = json.loads(line)
                    
                    # Check if this is a response to a pending request
                    request_id = message.get('id')
                    if request_id and request_id in self.pending_requests:
                        with self.lock:
                            response_queue = self.pending_requests.pop(request_id, None)
                        if response_queue:
                            response_queue.put(message)
                    else:
                        # This is a notification or other message
                        self.send_message({
                            "type": "mcp_notification",
                            "server_id": server_id,
                            "data": message
                        })
                except json.JSONDecodeError:
                    pass
            except Exception:
                break
        
        # Process ended
        self.send_message({
            "type": "mcp_server_stopped",
            "server_id": server_id
        })
        with self.lock:
            self.processes.pop(server_id, None)
    
    def _read_stderr(self, server_id: str, proc: subprocess.Popen) -> None:
        """Read stderr from MCP server process"""
        while self.running and proc.poll() is None:
            try:
                line = proc.stderr.readline()
                if not line:
                    break
                
                line = line.decode('utf-8').strip()
                if line:
                    self.send_message({
                        "type": "mcp_server_log",
                        "server_id": server_id,
                        "level": "error",
                        "message": line
                    })
            except Exception:
                break
    
    def run(self) -> None:
        """Main event loop"""
        while self.running:
            message = self.read_message()
            if message is None:
                break
            
            self.handle_message(message)
        
        # Cleanup
        self.running = False
        with self.lock:
            for server_id, proc in self.processes.items():
                try:
                    proc.terminate()
                    proc.wait(timeout=2)
                except:
                    try:
                        proc.kill()
                    except:
                        pass
    
    def handle_message(self, message: Dict[str, Any]) -> None:
        """Handle incoming message from Chrome"""
        msg_type = message.get('type')
        request_id = message.get('id')
        
        try:
            if msg_type == 'mcp_start':
                server_id = message.get('server_id')
                config = message.get('config')
                result = self.start_mcp_server(server_id, config)
                self.send_message({"id": request_id, "data": result})
                
            elif msg_type == 'mcp_stop':
                server_id = message.get('server_id')
                result = self.stop_mcp_server(server_id)
                self.send_message({"id": request_id, "data": result})
                
            elif msg_type == 'mcp_request':
                server_id = message.get('server_id')
                request = message.get('request')
                result = self.send_mcp_request(server_id, request)
                self.send_message({"id": request_id, "data": result})
                
            else:
                self.send_message({
                    "id": request_id,
                    "data": {"error": f"Unknown message type: {msg_type}"}
                })
        except Exception as e:
            self.send_message({
                "id": request_id,
                "data": {"error": str(e)}
            })

if __name__ == "__main__":
    host = NativeMessagingHost()
    host.run()