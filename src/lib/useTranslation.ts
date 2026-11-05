import { useCallback } from "react";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/translations";

export function useTranslation() {
  const { language } = useStore();
  const t = useCallback(
    (message: string, values?: Record<string, string | number>) =>
      translate(message, language, values),
    [language],
  );
  return {
    language,
    t,
  };
}
