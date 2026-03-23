import { Outlet, useLocation, useNavigate } from "react-router";
import { ThreePaneLayout } from "@repo/ui";
import { Button } from "@shopify/polaris";
import { useAppStore } from "../../store/app-store";
import { authenticate } from "../../shopify.server";
import type { LoaderFunctionArgs } from "react-router";
import OnboardingFab from "../../components/OnboardingFab.app";
import { SettingsSidebar, getSettingsTitle } from "./components";
import { usePaneMode } from "../../hooks/use-pane-mode";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    return null;
};

const CurrentOutlet = Outlet as any;

export default function SettingsLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isCompact, paneMode } = usePaneMode();

    const title = getSettingsTitle(location.pathname);

    // Header actions state from global store
    const isDirty = useAppStore((s) => s.settings.isDirty);
    const isLoading = useAppStore((s) => s.settings.isLoading);
    const onSave = useAppStore((s) => s.settings.onSave);
    const rightPane = useAppStore((s) => s.settings.rightPane);
    const hideRightPane = useAppStore((s) => s.settings.hideRightPane);

    return (
        <ThreePaneLayout
            header={{
                title,
                backButton: { label: "Home", onClick: () => navigate("/app") },
                actions: (
                    <Button
                        variant="primary"
                        disabled={!isDirty}
                        loading={isLoading}
                        onClick={() => onSave?.()}
                    >
                        Save
                    </Button>
                )
            }}
            loading={isLoading}
            leftPaneWidth={260}
            leftPaneTitle="Settings"
            leftPane={
                <SettingsSidebar currentPath={location.pathname} />
            }
            leftPaneBottom={
                <OnboardingFab variant="sidebar" />
            }
            contentLayout="contained"
            hideRightPane={hideRightPane}
            rightPane={rightPane as any}
            rightPaneTitle="Contextual Help"
            leftPaneMode={paneMode}
            rightPaneMode={paneMode}
            leftPaneCollapsed={isCompact}
            rightPaneCollapsed={isCompact}
        >
            <CurrentOutlet />
        </ThreePaneLayout>
    );
}
