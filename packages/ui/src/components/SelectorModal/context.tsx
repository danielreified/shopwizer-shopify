import { createContext, useContext } from 'react';

interface SelectorModalContextType {
  loading: boolean;
  loadingRows: number;
}

export const SelectorModalContext = createContext<SelectorModalContextType | undefined>(undefined);

export function useSelectorModal() {
  const context = useContext(SelectorModalContext);
  if (!context) {
    throw new Error('useSelectorModal must be used within a SelectorModal');
  }
  return context;
}
