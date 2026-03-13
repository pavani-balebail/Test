// Copyright 2026 Sirsi Corporation. All rights reserved.
import React, {createContext, useContext} from 'react';

export interface Translations {
  [key: string]: string | undefined;
}

interface TranslationsContextValue {
  getTranslations: () => Translations;
}

const TranslationsContext = createContext<TranslationsContextValue>({
  getTranslations: () => ({}),
});

export default TranslationsContext;

interface TranslationsProviderProps {
  translations: Translations;
  children: React.ReactNode;
}

export const TranslationsProvider: React.FC<TranslationsProviderProps> = ({
  translations,
  children,
}) => {
  const getTranslations = () => translations;
  return (
    <TranslationsContext.Provider value={{getTranslations}}>
      {children}
    </TranslationsContext.Provider>
  );
};

export const useTranslations = () => useContext(TranslationsContext);
