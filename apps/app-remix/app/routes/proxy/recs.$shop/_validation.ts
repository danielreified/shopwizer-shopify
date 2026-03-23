import { z } from "zod";

export const shopParam = z.string().regex(
  /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/,
  "Invalid shop domain",
);

export const productIdParam = z.string().regex(/^\d+$/, "Invalid product ID");

export const productIdList = z.string().regex(
  /^\d+(,\d+)*$/,
  "Invalid product ID list",
);

export const cartBodySchema = z.object({
  items: z.array(
    z.object({ productId: z.string().regex(/^\d+$/) }),
  ),
});

export function validateParams<T>(
  schema: z.ZodType<T>,
  value: unknown,
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(value);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    response: Response.json(
      { error: "Validation error", details: result.error.issues },
      { status: 400 },
    ),
  };
}
