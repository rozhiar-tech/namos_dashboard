"use client";

import { useState, useEffect } from "react";
import { getLanguage, setLanguage, t } from "../lib/i18n";

export default function useTranslation() {
  const [lang, setLangState] = useState(getLanguage());
  
  useEffect(() => {
    // Sync with localStorage changes
    const handleStorageChange = () => {
      setLangState(getLanguage());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  
  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    setLangState(newLang);
    // Trigger re-render by updating state
    window.dispatchEvent(new Event("languagechange"));
  };
  
  return {
    t: (key) => t(key, lang),
    language: lang,
    setLanguage: changeLanguage,
  };
}

