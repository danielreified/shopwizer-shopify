// src/utils/parseBool.ts

export function parseBool(v: any): boolean {
  if (typeof v === "string") return v === "true";
  return Boolean(v);
}

export const IS_BROWSER = typeof window !== "undefined";
