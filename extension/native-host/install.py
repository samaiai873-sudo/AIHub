#!/usr/bin/env python3
"""
Installer for AIHub Native Messaging Host

This script installs the native messaging host manifest for Chrome/Edge.
"""

import os
import json
import sys
import shutil
import platform
import subprocess

def get_chrome_native_messaging_dir():
    """Get the Chrome native messaging directory for the current OS"""
    system = platform.system()
    home = os.path.expanduser("~")
    
    if system == "Darwin":  # macOS
        # Chrome
        chrome_dir = os.path.join(home, "Library", "Application Support", "Google", "Chrome", "NativeMessagingHosts")
        # Edge
        edge_dir = os.path.join(home, "Library", "Application Support", "Microsoft Edge", "NativeMessagingHosts")
        return [chrome_dir, edge_dir]
    elif system == "Linux":
        # Chrome
        chrome_dir = os.path.join(home, ".config", "google-chrome", "NativeMessagingHosts")
        # Chromium
        chromium_dir = os.path.join(home, ".config", "chromium", "NativeMessagingHosts")
        # Edge
        edge_dir = os.path.join(home, ".config", "microsoft-edge", "NativeMessagingHosts")
        return [chrome_dir, chromium_dir, edge_dir]
    elif system == "Windows":
        # On Windows, we write to registry instead
        return []
    return []

def install_native_host():
    """Install the native messaging host manifest"""
    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    host_script = os.path.join(script_dir, "aihub_native_host.py")
    manifest_src = os.path.join(script_dir, "aihub_native_manifest.json")
    
    # Make host script executable
    os.chmod(host_script, 0o755)
    
    # Read manifest and update path
    with open(manifest_src, 'r') as f:
        manifest = json.load(f)
    
    manifest["path"] = host_script
    
    system = platform.system()
    
    if system == "Windows":
        # Windows: Write to registry
        import winreg
        try:
            key_path = r"Software\Google\Chrome\NativeMessagingHosts\com.aihub.native"
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as key:
                winreg.SetValue(key, "", winreg.REG_SZ, os.path.join(script_dir, "aihub_native_manifest.json"))
            
            # Also for Edge
            key_path = r"Software\Microsoft\Edge\NativeMessagingHosts\com.aihub.native"
            with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as key:
                winreg.SetValue(key, "", winreg.REG_SZ, os.path.join(script_dir, "aihub_native_manifest.json"))
            
            # Copy manifest to script directory
            manifest_dst = os.path.join(script_dir, "aihub_native_manifest.json")
            with open(manifest_dst, 'w') as f:
                json.dump(manifest, f, indent=2)
            
            print("Native messaging host installed (Windows registry)")
            return True
        except Exception as e:
            print(f"Failed to install on Windows: {e}")
            return False
    else:
        # macOS/Linux: Write manifest files
        dirs = get_chrome_native_messaging_dir()
        success = False
        
        for dir_path in dirs:
            try:
                os.makedirs(dir_path, exist_ok=True)
                manifest_dst = os.path.join(dir_path, "com.aihub.native.json")
                with open(manifest_dst, 'w') as f:
                    json.dump(manifest, f, indent=2)
                print(f"Installed manifest to {manifest_dst}")
                success = True
            except Exception as e:
                print(f"Failed to install to {dir_path}: {e}")
        
        return success

def uninstall_native_host():
    """Uninstall the native messaging host"""
    system = platform.system()
    home = os.path.expanduser("~")
    
    if system == "Windows":
        import winreg
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, r"Software\Google\Chrome\NativeMessagingHosts\com.aihub.native")
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Edge\NativeMessagingHosts\com.aihub.native")
            print("Native messaging host uninstalled (Windows registry)")
            return True
        except Exception as e:
            print(f"Failed to uninstall on Windows: {e}")
            return False
    else:
        dirs = get_chrome_native_messaging_dir()
        success = False
        
        for dir_path in dirs:
            manifest_path = os.path.join(dir_path, "com.aihub.native.json")
            try:
                if os.path.exists(manifest_path):
                    os.remove(manifest_path)
                    print(f"Removed {manifest_path}")
                    success = True
            except Exception as e:
                print(f"Failed to remove from {dir_path}: {e}")
        
        return success

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "uninstall":
        success = uninstall_native_host()
    else:
        success = install_native_host()
    
    sys.exit(0 if success else 1)