import crypto from "crypto";

export function generateSlateId(): string {
    return crypto.randomBytes(12).toString("hex");
}
