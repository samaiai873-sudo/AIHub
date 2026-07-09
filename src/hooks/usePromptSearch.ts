import { useMemo } from "react";
import type { Prompt } from "../types/prompt";

type UsePromptSearchParams = {
  prompts: Prompt[];
  keyword: string;
  provider: string;
};

export default function usePromptSearch({
  prompts,
  keyword,
  provider,
}: UsePromptSearchParams) {
  return useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return prompts.filter((prompt) => {
      const matchKeyword =
        !search ||
        prompt.title.toLowerCase().includes(search) ||
        prompt.content.toLowerCase().includes(search);

      const matchProvider =
        provider === "all" ||
        prompt.provider === provider;

      return matchKeyword && matchProvider;
    });
  }, [prompts, keyword, provider]);
}