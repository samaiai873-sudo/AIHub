import { useState } from "react";

import PromptForm from "./PromptForm";
import PromptList from "./PromptList";
import EmptyState from "./EmptyState";
import SearchBar from "./SearchBar";

import usePrompts from "../hooks/usePrompts";
import usePromptSearch from "../hooks/usePromptSearch";

import { providers } from "../data/providers";

export default function PromptLibrary() {
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState("chatgpt");
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");

  const {
    prompts,
    addPrompt,
    deletePrompt,
    toggleFavorite,
  } = usePrompts();

  const filteredPrompts = usePromptSearch({
    prompts,
    keyword: search,
    provider: filterProvider,
  });

  const handleAddPrompt = () => {
    addPrompt(input, provider);
    setInput("");
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
      <h2>📂 Prompt Library</h2>

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
          <option value="all">All</option>

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
        />
      )}
    </div>
  );
}