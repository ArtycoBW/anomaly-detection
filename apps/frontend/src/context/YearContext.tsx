'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface YearContextType {
  year: number;
  setYear: (year: number) => void;
}

const YearContext = createContext<YearContextType>({
  year: 2023,
  setYear: () => {},
});

export function YearProvider({ children }: { children: ReactNode }) {
  const [year, setYear] = useState(2023);

  return (
    <YearContext.Provider value={{ year, setYear }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  return useContext(YearContext);
}
