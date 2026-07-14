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

  const [selectedAgent, setSelectedAgent] =
    useLocalStorage<string | null>(
      "aihub-selected-agent",
      DEFAULT_AGENTS[0] ?? null
    );

  const isEnabled = (platform: string) => {
    return enabledAgents.includes(platform);
  };

  const toggleAgent = (platform: string) => {
    setEnabledAgents((prev) => {
      const next = prev.includes(platform)
        ? prev.filter((item) => item !== platform)
        : [...prev, platform];

      if (selectedAgent === platform && !next.includes(platform)) {
        setSelectedAgent(next[0] ?? null);
      }

      return next;
    });
  };

  const enableAll = () => {
    setEnabledAgents(DEFAULT_AGENTS);
    setSelectedAgent(
      selectedAgent && DEFAULT_AGENTS.includes(selectedAgent)
        ? selectedAgent
        : DEFAULT_AGENTS[0] ?? null
    );
  };

  return {
    enabledAgents,
    selectedAgent,
    setSelectedAgent,
    isEnabled,
    toggleAgent,
    enableAll,
  };
}