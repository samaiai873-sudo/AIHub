import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import { AgentProvider } from "./context/AgentContext";
import { ConversationProvider } from "./context/ConversationContext";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AgentProvider>
      <ConversationProvider>
        <App />
      </ConversationProvider>
    </AgentProvider>
  </StrictMode>
);