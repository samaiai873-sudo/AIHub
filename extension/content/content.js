// AIHub Content Script
// Injected into all pages for context menus, text selection, etc.

console.log('[AIHub] Content script loaded');

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SELECTION':
      sendResponse({ text: window.getSelection().toString() });
      break;
      
    case 'INJECT_SIDEPANEL':
      // Could inject a floating button here
      break;
  }
  
  return true;
});

// Add keyboard shortcut listener for quick access
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+A (or Cmd+Shift+A on Mac) to open side panel
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'TOGGLE_SIDEPANEL' });
  }
});

// Notify background that content script is ready
chrome.runtime.sendMessage({ type: 'CONTENT_READY', url: window.location.href });

console.log('[AIHub] Content script ready');