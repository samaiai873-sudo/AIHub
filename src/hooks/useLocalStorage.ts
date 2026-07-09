import { useEffect, useState } from "react";

export default function useLocalStorage<T>(
  key: string,
  initialValue: T
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);

      if (saved !== null) {
        return JSON.parse(saved);
      }

      return initialValue;
    } catch (error) {
      console.error("Failed to load LocalStorage:", error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save LocalStorage:", error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}