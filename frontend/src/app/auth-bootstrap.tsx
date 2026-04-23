"use client";

import { useEffect } from "react";
import useAuthStore from "@/store/auth";

/**
 * Initializes authentication state when the app loads.
 * @returns {null} No visual output
 */
export default function AuthBootstrap(): null {
  const initializeSession = useAuthStore((state) => state.initializeSession);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (isInitialized) {
      return;
    }
    void initializeSession();
  }, [initializeSession, isInitialized]);

  return null;
}
