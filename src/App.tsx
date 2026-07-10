import { useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import PromptLibrary from "./components/PromptLibrary";
import ConversationWorkspace from "./components/ConversationWorkspace";

export default function App() {
  const [page, setPage] = useState<
    "conversation" | "prompt"
  >("conversation");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#202123",
      }}
    >
      <Sidebar
        onOpenPrompt={() =>
          setPage("prompt")
        }
      />

      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        {page === "conversation" ? (
          <ConversationWorkspace />
        ) : (
          <PromptLibrary />
        )}
      </main>
    </div>
  );
}