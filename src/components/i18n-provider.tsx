"use client";

import { createContext, useContext, useState, useEffect } from "react";

const dictionary = {
  es: { home: "Inicio", spaces: "Catálogo", dashboard: "Mi Panel", logout: "Cerrar Sesión", title: "Trabaja a tu manera" },
  en: { home: "Home", spaces: "Catalog", dashboard: "My Dashboard", logout: "Logout", title: "Work your way" },
};

type Lang = "es" | "en";
const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: typeof dictionary.es }>({
  lang: "es", setLang: () => {}, t: dictionary.es,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");

  return (
    <I18nContext.Provider value={{ lang, setLang, t: dictionary[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);