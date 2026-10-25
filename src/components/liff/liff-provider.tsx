"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Liff } from "@line/liff";

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LiffContextValue {
  liff: Liff | null;
  isReady: boolean;
  isInClient: boolean;
  isLoggedIn: boolean;
  profile: LiffProfile | null;
  idToken: string | null;
  error: string | null;
  login: () => void;
  logout: () => void;
  sendMessage: (text: string) => Promise<boolean>;
  shareTargetPicker: (text: string) => Promise<boolean>;
  closeWindow: () => void;
}

const LiffContext = createContext<LiffContextValue | null>(null);

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liffObject, setLiffObject] = useState<Liff | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isInClient, setIsInClient] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initLiff = useCallback(async () => {
    try {
      const liffModule = await import("@line/liff");
      const liff = liffModule.default;
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "2012197159-qbSubL2Y";

      if (!liffId) {
        throw new Error("NEXT_PUBLIC_LIFF_ID is not configured in .env.local");
      }

      await liff.init({
        liffId,
        withLoginOnExternalBrowser: false,
      });

      setLiffObject(liff);
      setIsReady(true);
      setIsInClient(liff.isInClient());

      const loggedIn = liff.isLoggedIn();
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        try {
          const userProfile = await liff.getProfile();
          setProfile(userProfile);
          const rawIdToken = liff.getIDToken();
          setIdToken(rawIdToken);
        } catch (profileErr) {
          console.warn("Failed to fetch LIFF profile:", profileErr);
        }
      }
    } catch (err: any) {
      console.error("LIFF initialization error:", err);
      setError(err?.message || "Failed to initialize LINE LIFF");
    }
  }, []);

  useEffect(() => {
    initLiff();
  }, [initLiff]);

  const login = useCallback(() => {
    if (liffObject && !liffObject.isLoggedIn()) {
      liffObject.login();
    }
  }, [liffObject]);

  const logout = useCallback(() => {
    if (liffObject && liffObject.isLoggedIn()) {
      liffObject.logout();
      setIsLoggedIn(false);
      setProfile(null);
      setIdToken(null);
      window.location.reload();
    }
  }, [liffObject]);

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      if (!liffObject) return false;
      if (!liffObject.isInClient()) {
        alert("การส่งข้อความเข้าแชททำได้เฉพาะการเปิดผ่านแอป LINE เท่านั้น");
        return false;
      }
      try {
        await liffObject.sendMessages([{ type: "text", text }]);
        return true;
      } catch (sendErr) {
        console.error("Failed to send message:", sendErr);
        return false;
      }
    },
    [liffObject]
  );

  const shareTargetPicker = useCallback(
    async (text: string): Promise<boolean> => {
      if (!liffObject) return false;
      if (!liffObject.isApiAvailable("shareTargetPicker")) {
        alert("Share Target Picker ยังไม่เปิดใช้งานในช่องทางนี้");
        return false;
      }
      try {
        const res = await liffObject.shareTargetPicker([
          {
            type: "text",
            text,
          },
        ]);
        return res?.status === "success";
      } catch (shareErr) {
        console.error("Failed to share message:", shareErr);
        return false;
      }
    },
    [liffObject]
  );

  const closeWindow = useCallback(() => {
    if (liffObject && liffObject.isInClient()) {
      liffObject.closeWindow();
    }
  }, [liffObject]);

  return (
    <LiffContext.Provider
      value={{
        liff: liffObject,
        isReady,
        isInClient,
        isLoggedIn,
        profile,
        idToken,
        error,
        login,
        logout,
        sendMessage,
        shareTargetPicker,
        closeWindow,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}

export function useLiff() {
  const context = useContext(LiffContext);
  if (!context) {
    throw new Error("useLiff must be used within a LiffProvider");
  }
  return context;
}
