import React, { createContext, useContext, useState } from 'react';

interface MobileChromeContextType {
  hideMobileChrome: boolean;
  setHideMobileChrome: (hide: boolean) => void;
}

const MobileChromeContext = createContext<MobileChromeContextType>({
  hideMobileChrome: false,
  setHideMobileChrome: () => {}
});

export const MobileChromeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideMobileChrome, setHideMobileChrome] = useState(false);
  return (
    <MobileChromeContext.Provider value={{ hideMobileChrome, setHideMobileChrome }}>
      {children}
    </MobileChromeContext.Provider>
  );
};

export const useMobileChrome = () => useContext(MobileChromeContext);
