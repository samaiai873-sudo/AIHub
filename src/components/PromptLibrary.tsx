import { useRef, useState } from "react";

import PromptForm from "./PromptForm";
import PromptList from "./PromptList";
import EmptyState from "./EmptyState";
import SearchBar from "./SearchBar";
import PromptToolbar from "./PromptToolbar";
import DashboardStats from "./DashboardStats";

import usePrompts from "../hooks/usePrompts";
import usePromptSearch from "../hooks/usePromptSearch";

import {
  exportPrompts,
  importPrompts,
} from "../utils/promptImportExport";

import { providers } from "../data/providers";

export default function PromptLibrary() {
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState("chatgpt");
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    prompts,
    addPrompt,
    updatePrompt,
    replacePrompts,
    deletePrompt,
    toggleFavorite,
  } = usePrompts();

  const filteredPrompts = usePromptSearch({
    prompts,
    keyword: search,
    provider: filterProvider,
  });

  const total = prompts.length;

  const favorites = prompts.filter(
    (prompt) => prompt.favorite
  ).length;

  const providerCount = new Set(
  prompts.map((prompt) => prompt.platform)
).size;

  const currentFilter =
    filterProvider === "all"
      ? "All"
      : providers.find(
          (item) => item.id === filterProvider
        )?.name ?? filterProvider;

  const handleAddPrompt = () => {
   addPrompt(
  input,
  provider,
  "gpt-5"
);
    setInput("");
  };

  const handleImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const items = await importPrompts(file);

      const confirmed = window.confirm(
        "這將覆蓋目前所有 Prompt，是否繼續？"
      );

      if (!confirmed) return;

      replacePrompts(items);

      alert("匯入成功！");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "匯入失敗"
      );
    } finally {
      event.target.value = "";
    }
  };

  const copyPrompt = async (content: string) => {
    await navigator.clipboard.writeText(content);
    alert("已複製！");
  };

  return (
    <div
      style={{
        padding: 30,
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          📂 Prompt Library
        </h2>

        <PromptToolbar
          onImport={() => fileInputRef.current?.click()}
          onExport={() => exportPrompts(prompts)}
        />
      </div>

      <DashboardStats
        total={total}
        favorites={favorites}
        providers={providerCount}
        currentFilter={currentFilter}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{
          display: "none",
        }}
        onChange={handleImport}
      />

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <label>Provider Filter：</label>

        <select
          value={filterProvider}
          onChange={(event) =>
            setFilterProvider(event.target.value)
          }
          style={{
            marginLeft: 10,
            padding: 8,
            borderRadius: 8,
          }}
        >
          <option value="all">
            All
          </option>

          {providers.map((item) => (
            <option
              key={item.id}
              value={item.id}
            >
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      <PromptForm
        value={input}
        provider={provider}
        onChange={setInput}
        onProviderChange={setProvider}
        onSubmit={handleAddPrompt}
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
          onToggleFavorite={toggleFavorite}
          onUpdate={(
  id,
  content,
  platform,
  model
) =>
  updatePrompt(id, {
    content,
    platform,
    model,
  })
}
        />
      )}
    </div>
  );
}