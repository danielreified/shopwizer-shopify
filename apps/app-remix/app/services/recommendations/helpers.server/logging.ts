import { logger } from "@repo/logger";

export type LogColor = "cyan" | "magenta" | "yellow" | "green" | "blue";

export type Logger = (label: string, data?: unknown) => void;

export function createLogger(prefix: string, _color: LogColor = "cyan"): Logger {
    return (label: string, data?: unknown) => {
        // If data is an object, merge it; otherwise nest it under 'data' key
        const context = typeof data === "object" && data !== null && !Array.isArray(data)
            ? { ...data, module: prefix }
            : { data, module: prefix };

        logger.info(context, label);
    };
}
