"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "./Toast";

export function OfflineBanner() {
  const { show } = useToast();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setWasOffline(true);
      show("Offline, tetap bisa jualan", { tone: "warning" });
    };
    const goOnline = () => {
      if (wasOffline) {
        show("Online lagi, data akan disinkronkan", { tone: "success" });
      }
      setWasOffline(false);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [show, wasOffline]);

  return null;
}
