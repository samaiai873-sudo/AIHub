import { useMemo, useState } from "react";

import PromptForm from "./PromptForm";
import PromptList from "./PromptList";
import EmptyState from "./EmptyState";
import SearchBar from "./SearchBar";

import useLocalStorage from "../hooks/useLocalStorage";

import type { Prompt } from "../types/prompt";

export default function PromptLibrary() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const [prompts, setPrompts] = useLocalStorage<Prompt[]>(
    "aihub-prompts",
    []
  );

  const addPrompt = () => {
    if (!input.trim()) return;

    const now = new Date().toISOString();

    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      title: "AIHub",
      content: input,
      provider: "chatgpt",
      tags: [],
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };

    setPrompts([newPrompt, ...prompts]);
    setInput("");
  };

  const deletePrompt = (id: string) => {
    setPrompts(prompts.filter((prompt) => prompt.id !== id));
  };

  const copyPrompt = async (content: string) => {
    await navigator.clipboard.writeText(content);
    alert("已複製！");
  };

  const filteredPrompts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return prompts;
    }

    return prompts.filter((prompt) => {
      return (
        prompt.title.toLowerCase().includes(keyword) ||
        prompt.content.toLowerCase().includes(keyword)
      );
    });
  }, [prompts, search]);

  return (
    <div
      style={{
        padding: 30,
        color: "white",
      }}
    >
      <h2>📂 Prompt Library</h2>

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      <PromptForm
        value={input}
        onChange={setInput}
        onSubmit={addPrompt}
      />

      <hr
        style={{
          margin: "30px 0",
        }}
      />

      {filteredPrompts.length === 0 ? (
        <EmptyState />
      ) : (
        <PromptList
          prompts={filteredPrompts}
          onCopy={copyPrompt}
          onDelete={deletePrompt}
        />
      )}
    </div>
  );
}