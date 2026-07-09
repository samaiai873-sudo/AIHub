import PromptCard from "./PromptCard";

import type { Prompt } from "../types/prompt";

type PromptListProps = {
  prompts: Prompt[];
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
};

export default function PromptList({
  prompts,
  onCopy,
  onDelete,
}: PromptListProps) {
  return (
    <>
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onCopy={() => onCopy(prompt.content)}
          onDelete={() => onDelete(prompt.id)}
        />
      ))}
    </>
  );
}