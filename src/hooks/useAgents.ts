import useLocalStorage from "./useLocalStorage";

const DEFAULT_AGENTS = [
  "chatgpt",
  "claude",
  "gemini",
];

export default function useAgents() {
  const [enabledAgents, setEnabledAgents] =
    useLocalStorage<string[]>(
      "aihub-enabled-agents",
      DEFAULT_AGENTS
    );

  const isEnabled = (platform: string) => {
    return enabledAgents.includes(platform);
  };

  const toggleAgent = (platform: string) => {
    setEnabledAgents((prev) => {
      if (prev.includes(platform)) {
        return prev.filter(
          (item) => item !== platform
        );
      }

      return [...prev, platform];
    });
  };

  const enableAll = () => {
    setEnabledAgents(DEFAULT_AGENTS);
  };

  return {
    enabledAgents,
    isEnabled,
    toggleAgent,
    enableAll,
  };
}