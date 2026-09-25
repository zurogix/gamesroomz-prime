"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gamesroomz-prime-preview-upcoming";

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Product's "Preview upcoming stages" switch: off by default, remembered per browser. */
export function usePreviewUpcoming() {
  const [preview, setPreviewState] = useState(false);

  useEffect(() => {
    setPreviewState(readStored());
  }, []);

  const setPreview = useCallback((on: boolean) => {
    setPreviewState(on);
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      // Storage can be unavailable (private mode); the switch still works for this visit.
    }
  }, []);

  return { preview, setPreview };
}
