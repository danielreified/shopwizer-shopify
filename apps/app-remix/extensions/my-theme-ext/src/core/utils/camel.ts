// src/utils/camel.ts

export function toCamel(attr: string): string {
    return attr
      .replace(/^data-/, "")
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
  