import { useEffect, useState, useCallback } from "react";
import { secureStorage } from "../utils/secureStorage";

export default function useSecureLocalStorage<T>(
  key: string,
  initialValue: T
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from secure storage on mount
  useEffect(() => {
    const loadValue = async () => {
      try {
        const stored = await secureStorage.getItem(key);
        if (stored !== null) {
          setValue(JSON.parse(stored));
        }
      } catch (error) {
        console.error(`Failed to load secure storage for ${key}:`, error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadValue();
  }, [key]);

  // Save to secure storage on value change
  const setSecureValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolvedValue =
          typeof newValue === "function" ? (newValue as (prev: T) => T)(prev) : newValue;
        // Save asynchronously
        secureStorage.setItem(key, JSON.stringify(resolvedValue)).catch((error) => {
          console.error(`Failed to save secure storage for ${key}:`, error);
        });
        return resolvedValue;
      });
    },
    [key]
  );

  return [value, setSecureValue, isLoaded] as const;
}