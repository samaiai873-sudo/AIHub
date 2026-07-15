import { useCallback } from "react";
import useSecureLocalStorage from "./useSecureLocalStorage";

export type ApiKeys = Record<string, string>;

export default function useApiKeys() {
  const [apiKeys, setApiKeys, isLoaded] = useSecureLocalStorage<ApiKeys>(
    "aihub-api-keys",
    {}
  );

  const updateApiKey = useCallback((provider: string, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value.trim(),
    }));
  }, [setApiKeys]);

  const removeApiKey = useCallback((provider: string) => {
    setApiKeys((prev) => {
      const next = { ...prev };
      delete next[provider];
      return next;
    });
  }, [setApiKeys]);

  return {
    apiKeys,
    updateApiKey,
    removeApiKey,
    isLoaded,
  };
}