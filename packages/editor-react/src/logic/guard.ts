import { createContext, useContext } from 'react';

export type Ask = (label: string, count: number) => Promise<boolean>;

export const GuardContext = createContext<Ask>(() => Promise.resolve(true));

export const useRemovalGuard = () => useContext(GuardContext);
