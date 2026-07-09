import type { Prompt } from "../types/prompt";

export function exportPrompts(prompts: Prompt[]) {
  const json = JSON.stringify(prompts, null, 2);

  const blob = new Blob([json], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `AIHub-${date}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function isPromptArray(
  value: unknown
): value is Prompt[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "content" in item &&
        "provider" in item
    )
  );
}