"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Context 정의
const SearchContext = createContext<{
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}>({ searchTerm: '', setSearchTerm: () => {} });

// Provider 컴포넌트
export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
};

// Context 사용을 위한 커스텀 훅
export const useSearch = () => useContext(SearchContext);
