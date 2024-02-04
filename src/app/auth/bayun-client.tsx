"use client";

import "./bayun.js";
import React, { createContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface BayunContextType {
  sessionId: string;
  isSignedIn: boolean;
  isLoading: boolean;
  signOut: () => void;
  signIn: (username: string, password: string) => void;
}

interface BayunProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<BayunContextType | undefined>(undefined);

const BayunProvider = ({ children }: BayunProviderProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const [sessionId, setSessionId] = useState<string>("");
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedSessionId = localStorage.getItem("bayunSessionId");
    if (savedSessionId) {
      setSessionId(savedSessionId);
      setIsSignedIn(true);
      setIsLoading(false);
    } else {
      if (pathname !== "/auth") {
        router.push("/auth");
        setIsSignedIn(false);
        setIsLoading(false);
      }
    }
  }, []);

  const BayunCore = (window as any).BayunCore;
  const bayunClient = BayunCore.init(
    "2a26e33bae7641acb62504821bba57d3",
    "967189a19f4e4e78865819d19ef8b161",
    "/OFFIlW/NyD3lOSoqmNARjqwgu/UN4dVOowqhITEKfE=",
    BayunCore.LocalDataEncryptionMode.EXPLICIT_LOGOUT_MODE,
    false,
    "https://www.digilockbox.com/",
  );

  const signIn = (username: string, password: string) => {
    bayunClient.loginWithPassword(
      "",
      "see",
      username,
      password,
      true, // auto-create accounts
      () => {},
      () => {},
      ({ sessionId }: { sessionId: string }) => {
        localStorage.setItem("bayunSessionId", sessionId);
        setSessionId(sessionId);
        setIsSignedIn(true);
        router.push('/')
        // setTimeout(() => router.push("/"), 1000);
      },
      (err: any) => console.error("bayun login error", err),
    );
  };

  const signOut = () => {
    bayunClient.logout(sessionId);
    localStorage.removeItem("bayunSessionId");
    setIsSignedIn(false);
    setSessionId("");
  };

  return (
    <AuthContext.Provider
      value={{
        sessionId,
        isSignedIn,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useBayun = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useBayun must be used within a BayunProvider");
  }
  return context;
};

export default BayunProvider;
