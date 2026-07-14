import useLocalStorage from "./useLocalStorage";

export type ApiKeys = Record<string, string>;

const defaultApiKeys: ApiKeys = {};

export default function useApiKeys() {
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>(
    "aihub-api-keys",
    defaultApiKeys
  );

  const updateApiKey = (provider: string, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value.trim(),
    }));
  };

  const removeApiKey = (provider: string) => {
    setApiKeys((prev) => {
      const next = { ...prev };
      delete next[provider];
      return next;
    });
  };

  return {
    apiKeys,
    updateApiKey,
    removeApiKey,
  };
}
