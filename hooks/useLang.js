// hooks/useLang.js
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../lib/i18n";

const LANG_KEY = "app.language";

const LangCtx = createContext({
  lang: "en",
  setLang: (_l) => {},
  t: (k, o) => i18n.t(k, o),
});

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(i18n.locale || "en");

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LANG_KEY);
      if (saved) {
        i18n.locale = saved;
        setLangState(saved);
      }
    })();
  }, []);

  async function setLang(next) {
    const code = next.split("-")[0]; // keep "en"/"bn"
    i18n.locale = code;
    setLangState(code);
    await AsyncStorage.setItem(LANG_KEY, code);
  }

  // IMPORTANT: bind t to the i18n instance
  const t = (key, opts) => i18n.t(key, opts);

  return (
    <LangCtx.Provider value={{ lang, setLang, t }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}
