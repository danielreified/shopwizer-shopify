import { useBreakpoints } from "@shopify/polaris";

export function usePaneMode() {
  const { lgDown } = useBreakpoints({ defaults: { lgDown: false } });
  const isCompact = lgDown;
  return {
    isCompact,
    paneMode: isCompact ? "overlay" : "inline",
  } as const;
}
