"use client";
import React, { createContext, useState } from "react";
import "./bayun.js";

interface BayunContextType {
  sessionId: string,
  signOut: () => void,
  signIn: (username: string, password: string) => void,
}

interface BayunProviderProps {
  children: React.ReactNode
}

const AuthContext = createContext<BayunContextType | undefined>(undefined);

const BayunProvider = ({ children }: BayunProviderProps) => {
  const [sessionId, setSessionId] = useState<string>("");

  const BayunCore = (window as any).BayunCore;
  const bayunClient = BayunCore.init(
    '2a26e33bae7641acb62504821bba57d3',
    '967189a19f4e4e78865819d19ef8b161',
    '/OFFIlW/NyD3lOSoqmNARjqwgu/UN4dVOowqhITEKfE=',
    BayunCore.LocalDataEncryptionMode.EXPLICIT_LOGOUT_MODE,
    false,
    'https://www.digilockbox.com/'
  );

  const signIn = (username: string, password: string) => {
    bayunClient.loginWithPassword(
      '',
      'see', 
      username, 
      password,
      true, // auto-create accounts
      () => {},
      () => {},
      ({ sessionId }: { sessionId: string }) => {
        setSessionId(sessionId);
      },
      (err: any) => console.error('bayun login error', err)
    );
  };

  const signOut = () => {
    bayunClient.logout(
      sessionId
    );
  };

  return (
    <AuthContext.Provider value={{
      sessionId,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useBayun = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useBayun must be used within a BayunProvider');
  }
  return context;
};

export default BayunProvider;