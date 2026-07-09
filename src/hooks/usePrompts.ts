import useLocalStorage from "./useLocalStorage";
import type { Prompt } from "../types/prompt";

export default function usePrompts() {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>(
    "aihub-prompts",
    []
  );

  const addPrompt = (
    content: string,
    provider: string
  ) => {
    if (!content.trim()) return;

    const now = new Date().toISOString();

    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      title: "AIHub",
      content,
      provider,
      tags: [],
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };

    setPrompts((prev) => [newPrompt, ...prev]);
  };

  const deletePrompt = (id: string) => {
    setPrompts((prev) =>
      prev.filter((prompt) => prompt.id !== id)
    );
  };

  const toggleFavorite = (id: string) => {
    setPrompts((prev) =>
      prev.map((prompt) =>
        prompt.id === id
          ? {
              ...prompt,
              favorite: !prompt.favorite,
              updatedAt: new Date().toISOString(),
            }
          : prompt
      )
    );
  };

  const replacePrompts = (items: Prompt[]) => {
    setPrompts(items);
  };

  const clearPrompts = () => {
    setPrompts([]);
  };

  return {
    prompts,
    addPrompt,
    deletePrompt,
    toggleFavorite,
    replacePrompts,
    clearPrompts,
  };
}