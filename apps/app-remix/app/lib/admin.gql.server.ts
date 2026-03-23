import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function adminGQL<TData, TVars = Record<string, unknown>>(
  request: LoaderFunctionArgs["request"] | ActionFunctionArgs["request"],
  query: string,
  variables?: TVars,
  retries = 3,
): Promise<TData> {
  const { admin } = await authenticate.admin(request);
  let last: any;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await admin.graphql(query, { variables });
      const json = await res.json().catch(() => ({}));

      if (res.status === 429) {
        if (i === retries) throw new Error("429");
        await sleep(300 * (i + 1));
        continue;
      }

      if (!res.ok || json?.errors?.length) {
        throw new Error(
          (json?.errors || []).map((e: any) => e.message).join("; "),
        );
      }

      const ue = findUE(json?.data);

      if (ue) {
        throw new Error(
          ue
            .map((u) => `${u.field?.join(".") ?? "input"}: ${u.message}`)
            .join("; "),
        );
      }

      return json.data as TData;
    } catch (e) {
      last = e;
      if (i === retries) break;

      await sleep(250 * Math.pow(2, i));
    }
  }

  throw last ?? new Error("GraphQL failed");
}

function findUE(data: any) {
  if (!data) return null;

  for (const k of Object.keys(data)) {
    const v = data[k];

    if (v?.userErrors?.length) {
      return v.userErrors;
    }
  }

  return null;
}
