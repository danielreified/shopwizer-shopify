export { RouteErrorBoundary as ErrorBoundary } from "../../../components/RouteErrorBoundary";
import { useLoaderData, useFetcher } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useEffect, useState, useMemo } from "react";
import {
  BlockStack as PolarisBlockStack,
  Box as PolarisBox,
  Divider as PolarisDivider,
  Text as PolarisText,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Footer } from "@repo/ui/components/Footer";
import { authenticate } from "../../../shopify.server";
import { buildFormData } from "../../../lib/form-actions";
import prisma from "../../../db.server";
import { useAppStore } from "../../../store/app-store";
import {
  ContactSection,
  HelpfulTipsPane,
  NotificationsSection,
  PreferencesSection,
} from "./components";

const BlockStack = PolarisBlockStack as any;
const Box = PolarisBox as any;
const Divider = PolarisDivider as any;
const Text = PolarisText as any;


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  let settings = await prisma.shopSettings.findUnique({
    where: { shopId },
  });

  if (!settings) {
    settings = await prisma.shopSettings.create({
      data: { shopId },
    });
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      recommenderPreferences: true,
    },
  });

  const prefs = shop?.recommenderPreferences as { gender?: string; age?: string } | null;

  return {
    contactName: settings.contactName ?? "",
    contactEmail: settings.contactEmail ?? "",
    productCapAlerts: settings.productCapAlerts,
    gender: prefs?.gender ?? "auto",
    age: prefs?.age ?? "auto",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopId = session.shop;

  const fd = await request.formData();
  const intent = fd.get("intent");

  if (intent === "saveContact") {
    const contactName = fd.get("contactName")?.toString() ?? null;
    const contactEmail = fd.get("contactEmail")?.toString() ?? null;

    await prisma.shopSettings.upsert({
      where: { shopId },
      create: { shopId, contactName, contactEmail },
      update: { contactName, contactEmail },
    });

    return { ok: true };
  }

  if (intent === "saveNotifications") {
    const productCapAlerts = fd.get("productCapAlerts") === "true";

    await prisma.shopSettings.upsert({
      where: { shopId },
      create: { shopId, productCapAlerts },
      update: { productCapAlerts },
    });

    return { ok: true };
  }


  if (intent === "savePreferences") {
    const gender = String(fd.get("gender") || "auto");
    const age = String(fd.get("age") || "auto");

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        recommenderPreferences: {
          gender,
          age,
        },
      },
    });

    return { ok: true };
  }

  return { ok: false, error: "Unknown intent" };
};

export default function Settings() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const setSettingsState = useAppStore((s) => s.setSettingsState);

  // Local state
  const [contactName, setContactName] = useState(loaderData.contactName);
  const [contactEmail, setContactEmail] = useState(loaderData.contactEmail);
  const [productCapAlerts, setProductCapAlerts] = useState(loaderData.productCapAlerts);

  // Verticals & Prefs state
  const [gender, setGender] = useState(loaderData.gender);
  const [age, setAge] = useState(loaderData.age);

  // Sync local state with loader data when it changes
  useEffect(() => {
    setContactName(loaderData.contactName);
    setContactEmail(loaderData.contactEmail);
    setProductCapAlerts(loaderData.productCapAlerts);
    setGender(loaderData.gender);
    setAge(loaderData.age);
  }, [loaderData]);

  // Check if any value has changed from loader data
  const isDirty = useMemo(() => {
    return (
      contactName !== loaderData.contactName ||
      contactEmail !== loaderData.contactEmail ||
      productCapAlerts !== loaderData.productCapAlerts ||
      gender !== loaderData.gender ||
      age !== loaderData.age
    );
  }, [contactName, contactEmail, productCapAlerts, gender, age, loaderData]);

  // Sync local settings state to global store for header Save button
  useEffect(() => {
    setSettingsState({
      isDirty,
      onSave: handleSave,
      isLoading: fetcher.state !== "idle",
      rightPane: <HelpfulTipsPane />,
    });

    // Clear on unmount
    return () => setSettingsState({ isDirty: false, onSave: undefined, isLoading: false, rightPane: undefined });
  }, [isDirty, fetcher.state, setSettingsState]);

  // Save all changes
  const handleSave = () => {
    // Save contact
    if (contactName !== loaderData.contactName || contactEmail !== loaderData.contactEmail) {
      fetcher.submit(buildFormData("saveContact", { contactName, contactEmail }), { method: "post" });
    }

    // Save notifications
    if (productCapAlerts !== loaderData.productCapAlerts) {
      fetcher.submit(buildFormData("saveNotifications", { productCapAlerts: String(productCapAlerts) }), { method: "post" });
    }

    // Save preferences
    if (gender !== loaderData.gender || age !== loaderData.age) {
      fetcher.submit(buildFormData("savePreferences", { gender, age }), { method: "post" });
    }

    // Hide save bar and show toast
    shopify.saveBar.hide("settings-save-bar");
    shopify.toast.show("Settings saved");
  };

  return (
    <Box padding="800">
      <BlockStack gap="800">
        <BlockStack gap="200">
          <Text variant="headingLg" as="h1">General Settings</Text>
          <Text variant="bodyMd" as="p" tone="subdued">Manage your contact information, notification preferences, and storewide product defaults.</Text>
        </BlockStack>

        <ContactSection
          contactName={contactName}
          contactEmail={contactEmail}
          onNameChange={setContactName}
          onEmailChange={setContactEmail}
        />

        <Divider />

        <NotificationsSection
          productCapAlerts={productCapAlerts}
          onProductCapAlertsChange={setProductCapAlerts}
        />


        <Divider />

        <PreferencesSection
          gender={gender}
          age={age}
          onGenderChange={setGender}
          onAgeChange={setAge}
        />
      </BlockStack>

      <Footer
        text="Learn more about"
        linkLabel="managing notifications"
        linkUrl="https://help.shopify.com/manual/your-account/notifications"
      />
    </Box>
  );
}
