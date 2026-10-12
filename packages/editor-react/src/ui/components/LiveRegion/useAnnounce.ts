import { createContext, useContext } from 'react';

export type Announce = (message: string) => void;

export const AnnounceContext = createContext<Announce>(() => undefined);

export function useAnnounce(): Announce {
  return useContext(AnnounceContext);
}
