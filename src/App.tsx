import { useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import PromptLibrary from "./components/PromptLibrary";
import Home from "./pages/Home";

export default function App() {
  const [page, setPage] = useState<"home" | "prompt">("home");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#202123",
      }}
    >
      <Sidebar onOpenPrompt={() => setPage("prompt")} />

      <main
        style={{
          flex: 1,
          overflow: "auto",
        }}
      >
        {page === "home" ? <Home /> : <PromptLibrary />}
      </main>
    </div>
  );
}