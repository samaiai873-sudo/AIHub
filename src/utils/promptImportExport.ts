import type { Prompt } from "../types/prompt";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function exportPrompts(prompts: Prompt[]) {
  const blob = new Blob(
    [JSON.stringify(prompts, null, 2)],
    {
      type: "application/json",
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `AIHub-${formatDate(new Date())}.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export async function importPrompts(
  file: File
): Promise<Prompt[]> {
  const text = await file.text();

  const data = JSON.parse(text);

  if (!Array.isArray(data)) {
    throw new Error("JSON 格式錯誤");
  }

  for (const item of data) {
    if (
      typeof item.id !== "string" ||
      typeof item.title !== "string" ||
      typeof item.content !== "string" ||
      typeof item.provider !== "string"
    ) {
      throw new Error("Prompt 資料格式錯誤");
    }
  }

  return data as Prompt[];
}