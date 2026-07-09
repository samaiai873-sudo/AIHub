import PromptCard from "./PromptCard";
import type { Prompt } from "../types/prompt";

type PromptListProps = {
  prompts: Prompt[];
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

export default function PromptList({
  prompts,
  onCopy,
  onDelete,
  onToggleFavorite,
}: PromptListProps) {
  return (
    <>
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onCopy={onCopy}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </>
  );
}