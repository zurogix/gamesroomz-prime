"use client";

import { createContext, useContext } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error" | "conflict";

export type SaveStatus = {
  state: SaveState;
  savedAt: number | null;
  message: string;
  retry: () => void;
};

export const SaveStatusContext = createContext<SaveStatus | null>(null);

export const useSaveStatus = () => useContext(SaveStatusContext);
