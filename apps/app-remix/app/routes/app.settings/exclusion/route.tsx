export { RouteErrorBoundary as ErrorBoundary } from "../../../components/RouteErrorBoundary";
import { useLoaderData, useFetcher } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useState, useEffect } from "react";
import { useAppStore } from "../../../store/app-store";
import { BlockStack, Box } from "@shopify/polaris";
import { Footer } from "@repo/ui/components/Footer";
import { authenticate } from "../../../shopify.server";
import prisma from "../../../db.server";
import CategorySelectorModal from "../../../components/CategorySelectorModal";
import type { CategoryNode } from "../../../components/CategorySelectorModal";
import TagSelectorModal from "../../../components/TagSelectorModal";
import { ExclusionFormPane, ExclusionsHeader, ExclusionsTable } from "./components";

// ---------- Remix ----------
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  const rules = await prisma.exclusionRule.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      itemValue: true,
      type: true,
      withDesc: true,
      mode: true,
    },
  });

  return { rules };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  const fd = await request.formData();
  const intent = fd.get("intent");

  if (intent === "saveRule") {
    const rulesJson = String(fd.get("rules"));
    const rules = JSON.parse(rulesJson);

    // rules is an array from the frontend selection
    for (const rule of rules) {
      const ruleData = {
        shopId,
        type: rule.type,
        label: rule.label,
        itemValue: rule.itemValue,
        withDesc: rule.withDesc,
        mode: rule.mode,
      };

      const existing = await prisma.exclusionRule.findFirst({
        where: {
          shopId,
          type: rule.type,
          itemValue: rule.itemValue,
          mode: rule.mode,
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.exclusionRule.update({
          where: { id: existing.id },
          data: ruleData,
        });
      } else {
        await prisma.exclusionRule.create({
          data: ruleData,
        });
      }
    }
    return { ok: true };
  }

  if (intent === "deleteRule") {
    const id = String(fd.get("id"));
    await prisma.exclusionRule.delete({
      where: { id, shopId },
    });
    return { ok: true };
  }

  return { ok: false };
};

// ---------- Types / helpers ----------
type ExclusionMode = "GLOBAL_EXCLUSION" | "PAGE_SUPPRESSION";

type ExclusionRule = {
  id: string;
  label: string;
  itemValue: string;
  type: "CATEGORY" | "TAG";
  withDesc: boolean;
  mode: ExclusionMode;
};

export default function RecommendationExclusions() {
  const { rules } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const setSettingsState = useAppStore((s) => s.setSettingsState);

  // Exclusions list - sync with server data
  const [exclusions, setExclusions] = useState<ExclusionRule[]>(rules as any);

  useEffect(() => {
    setExclusions(rules as any);
  }, [rules]);

  // Selection logic state
  const [exclusionType, setExclusionType] = useState<"CATEGORY" | "TAG">("CATEGORY");
  const [selectedItems, setSelectedItems] = useState<{ id: string; label: string }[]>([]);
  const [withDesc, setWithDesc] = useState(true);
  const [mode, setMode] = useState<ExclusionMode>("GLOBAL_EXCLUSION");

  // Modal/Picker state
  const [modalOpen, setModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  function removeItem(id: string) {
    fetcher.submit({ intent: "deleteRule", id }, { method: "POST" });
  }

  function saveRule() {
    if (selectedItems.length === 0) return;
    const newRules = selectedItems.map(({ id, label }) => ({
      type: exclusionType,
      label,
      itemValue: id,
      withDesc,
      mode,
    }));

    fetcher.submit(
      { intent: "saveRule", rules: JSON.stringify(newRules) },
      { method: "POST" }
    );

    // reset form
    setSelectedItems([]);
    setWithDesc(true);
    setMode("GLOBAL_EXCLUSION");
  }

  function toggleTag(tag: string) {
    setSelectedItems(prev => {
      const isAlreadyInList = exclusions.some(e => e.label === tag && e.type === "TAG" && e.mode === mode);
      if (isAlreadyInList) return prev;

      const exists = prev.find(p => p.label === tag);
      if (exists) return prev.filter(p => p.label !== tag);
      return [...prev, { id: `tag-${tag}`, label: tag }];
    });
  }

  const modalMarkup = (
    <CategorySelectorModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      onSelect={(cat: CategoryNode) => {
        setSelectedItems(prev => {
          const isAlreadyInList = exclusions.some(e => e.itemValue === cat.id && e.mode === mode);
          const isAlreadySelected = prev.find(p => p.id === cat.id);
          if (isAlreadyInList || isAlreadySelected) return prev;
          return [...prev, { id: cat.id, label: cat.fullName }];
        });
      }}
    />
  );

  const tagModalMarkup = (
    <TagSelectorModal
      open={tagModalOpen}
      onClose={() => setTagModalOpen(false)}
      selectedTags={selectedItems.map(i => i.label)}
      onSelect={(tag: string) => toggleTag(tag)}
    />
  );

  // Update global settings state when local state changes
  useEffect(() => {
    setSettingsState({
      isDirty: false,
      onSave: () => { },
      isLoading: fetcher.state !== "idle",
      hideRightPane: false,
      rightPane: (
        <ExclusionFormPane
          exclusionType={exclusionType}
          selectedItems={selectedItems}
          withDesc={withDesc}
          mode={mode}
          onTypeChange={(value) => {
            setExclusionType(value);
            setSelectedItems([]);
          }}
          onOpenCategoryModal={() => setModalOpen(true)}
          onOpenTagModal={() => setTagModalOpen(true)}
          onRemoveSelected={(id) =>
            setSelectedItems((prev) => prev.filter((x) => x.id !== id))
          }
          onWithDescChange={setWithDesc}
          onModeChange={setMode}
          onSave={saveRule}
        />
      ) as any,
    });

    return () => setSettingsState({
      hideRightPane: true,
      rightPane: undefined,
      isLoading: false
    });
  }, [
    setSettingsState,
    exclusionType,
    selectedItems,
    withDesc,
    mode,
    fetcher.state
  ]);

  // Seed some initial data for visual demo if empty
  useEffect(() => {
    // Seed removed - using real DB data
  }, []);

  return (
    <Box padding="600">
      <BlockStack gap="600">
        <ExclusionsHeader />
        <ExclusionsTable
          exclusions={exclusions}
          onRemove={removeItem}
        />

        <Box paddingBlockStart="800">
          <Footer
            text="Need help? Learn more about"
            linkLabel="recommendation strategies"
            linkUrl="https://help.shopify.com/manual/online-store/themes/theme-structure/sections"
          />
        </Box>
      </BlockStack>
      {modalMarkup}
      {tagModalMarkup}
    </Box>
  );
}
