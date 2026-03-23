export { RouteErrorBoundary as ErrorBoundary } from "../../components/RouteErrorBoundary";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { SaveBar as PolarisSaveBar, useAppBridge } from "@shopify/app-bridge-react";

const SaveBar = PolarisSaveBar as any;
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import {
    EditorTopBar,
    EditorNavSidebar,
    EditorCodePane,
    EditorThemeSidebar,
} from "./components";



// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type StyleKey =
    | 'global'
    | 'product-rail'
    | 'pdp-similar'
    | 'pdp-trending'
    | 'pdp-sellers'
    | 'pdp-arrivals'
    | 'pdp-recent'
    | 'pdp-bundles'
    | 'cart-recs'
    | 'cart-drawer'
    | 'modal';

interface CustomStyle {
    key: string;
    css: string;
    themeId: string;
}

interface ShopifyTheme {
    id: string;
    name: string;
    role: 'MAIN' | 'UNPUBLISHED' | 'DEMO' | 'DEVELOPMENT';
}

// ---------------------------------------------------------------------------
// LOADER - Fetch themes and current styles
// ---------------------------------------------------------------------------
export async function loader({ request }: LoaderFunctionArgs) {
    const { session, admin } = await authenticate.admin(request);
    const shopId = session.shop;

    // Fetch themes from Shopify Admin API
    const themesResponse = await admin.graphql(`
        query {
            themes(first: 20) {
                edges {
                    node {
                        id
                        name
                        role
                    }
                }
            }
        }
    `);
    const themesData = await themesResponse.json();
    const themes: ShopifyTheme[] = themesData.data?.themes?.edges?.map((edge: any) => ({
        id: edge.node.id.replace('gid://shopify/OnlineStoreTheme/', ''),
        name: edge.node.name,
        role: edge.node.role,
    })) || [];

    // Find the main (live) theme
    const mainTheme = themes.find(t => t.role === 'MAIN');
    const defaultThemeId = mainTheme?.id || themes[0]?.id || '';

    // Fetch all styles for this shop (all themes)
    const styles = await prisma.customStyle.findMany({
        where: { shopId },
    });

    return {
        styles: styles.map(s => ({ key: s.key, css: s.css || '', themeId: s.themeId })) as CustomStyle[],
        themes,
        defaultThemeId,
        shop: session.shop,
    };
}

// ---------------------------------------------------------------------------
// ACTION - Save styles (per-theme)
// ---------------------------------------------------------------------------
export async function action({ request }: ActionFunctionArgs) {
    const { session } = await authenticate.admin(request);
    const shopId = session.shop;

    const formData = await request.formData();
    const key = formData.get("key") as string;
    const css = formData.get("css") as string;
    const themeId = formData.get("themeId") as string;

    if (!themeId) {
        return { ok: false, error: "themeId is required" };
    }

    await prisma.customStyle.upsert({
        where: {
            shopId_themeId_key: {
                shopId,
                themeId,
                key,
            },
        },
        create: {
            shopId,
            themeId,
            key,
            css,
        },
        update: {
            css,
        },
    });

    return { ok: true };
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function EditorPage() {
    const { styles, themes, defaultThemeId, shop } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const shopify = useAppBridge();

    // Theme selection state
    const [selectedThemeId, setSelectedThemeId] = useState<string>(defaultThemeId);

    // All available style keys
    const allKeys: StyleKey[] = [
        'global',
        'product-rail',
        'pdp-similar',
        'pdp-trending',
        'pdp-sellers',
        'pdp-arrivals',
        'pdp-recent',
        'pdp-bundles',
        'cart-recs',
        'cart-drawer',
        'modal'
    ];

    // Filter styles for the selected theme
    const themeStyles = useMemo(() =>
        styles.filter(s => s.themeId === selectedThemeId),
        [styles, selectedThemeId]
    );

    const [activeKey, setActiveKey] = useState<StyleKey>('global');
    const [localStyles, setLocalStyles] = useState<Record<StyleKey, string>>(() => {
        const map: Record<StyleKey, string> = {} as Record<StyleKey, string>;
        allKeys.forEach(key => { map[key] = ''; });
        themeStyles.forEach((s: CustomStyle) => {
            if (allKeys.includes(s.key as StyleKey)) {
                map[s.key as StyleKey] = s.css;
            }
        });
        return map;
    });

    // Update local styles when theme changes
    useEffect(() => {
        const map: Record<StyleKey, string> = {} as Record<StyleKey, string>;
        allKeys.forEach(key => { map[key] = ''; });
        themeStyles.forEach((s: CustomStyle) => {
            if (allKeys.includes(s.key as StyleKey)) {
                map[s.key as StyleKey] = s.css;
            }
        });
        setLocalStyles(map);
    }, [selectedThemeId, themeStyles]);

    const isDirty = useMemo(() => {
        const originalMap: Record<StyleKey, string> = {} as Record<StyleKey, string>;
        allKeys.forEach(key => { originalMap[key] = ''; });
        themeStyles.forEach((s: CustomStyle) => {
            if (allKeys.includes(s.key as StyleKey)) {
                originalMap[s.key as StyleKey] = s.css;
            }
        });
        return JSON.stringify(localStyles) !== JSON.stringify(originalMap);
    }, [localStyles, themeStyles]);

    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show("editor-save-bar");
        } else {
            shopify.saveBar.hide("editor-save-bar");
        }
    }, [isDirty, shopify]);

    const handleSave = () => {
        const formData = new FormData();
        formData.append("key", activeKey);
        formData.append("css", localStyles[activeKey]);
        formData.append("themeId", selectedThemeId);
        fetcher.submit(formData, { method: "post" });
        shopify.toast.show("Changes saved");
    };

    const handleDiscard = () => {
        const map: Record<StyleKey, string> = {} as Record<StyleKey, string>;
        allKeys.forEach(key => { map[key] = ''; });
        themeStyles.forEach((s: CustomStyle) => {
            if (allKeys.includes(s.key as StyleKey)) {
                map[s.key as StyleKey] = s.css;
            }
        });
        setLocalStyles(map);
    };

    const navItems = [
        { key: 'global' as StyleKey, label: 'Global Styles', description: 'Applies to all Shopwise elements', group: 'Core' },
        { key: 'product-rail' as StyleKey, label: 'Product Rails (All)', description: 'Base styles for all product rails', group: 'Core' },
        { key: 'pdp-similar' as StyleKey, label: 'Similar Products', description: 'You may also like widget', group: 'PDP Widgets' },
        { key: 'pdp-trending' as StyleKey, label: 'Trending', description: 'Trending products widget', group: 'PDP Widgets' },
        { key: 'pdp-sellers' as StyleKey, label: 'Best Sellers', description: 'Best sellers widget', group: 'PDP Widgets' },
        { key: 'pdp-arrivals' as StyleKey, label: 'New Arrivals', description: 'New arrivals widget', group: 'PDP Widgets' },
        { key: 'pdp-recent' as StyleKey, label: 'Recently Viewed', description: 'Recently viewed products', group: 'PDP Widgets' },
        { key: 'pdp-bundles' as StyleKey, label: 'PDP Bundles', description: 'Complete the Look widget', group: 'PDP Widgets' },
        { key: 'cart-recs' as StyleKey, label: 'Cart Recommendations', description: 'Cart page recommendations', group: 'Cart' },
        { key: 'cart-drawer' as StyleKey, label: 'Cart Drawer', description: 'Slide-out cart drawer recs', group: 'Cart' },
        { key: 'modal' as StyleKey, label: 'Quick View Modal', description: 'Product quick view overlay', group: 'Components' },
    ];

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f6f6f7" }}>
            <SaveBar id="editor-save-bar">
                <button onClick={handleSave}>Save</button>
                <button onClick={handleDiscard}>Discard</button>
            </SaveBar>

            <EditorTopBar
                onExit={() => navigate("/app")}
                onPreview={() => window.open(`https://${shop}?preview_theme_id=${selectedThemeId}`, "_blank")}
                onSave={handleSave}
                saveDisabled={!isDirty}
            />

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <EditorNavSidebar
                    navItems={navItems}
                    activeKey={activeKey}
                    onSelect={(key) => setActiveKey(key as StyleKey)}
                />

                <EditorCodePane
                    activeKey={activeKey}
                    value={localStyles[activeKey]}
                    onChange={(value) => setLocalStyles({ ...localStyles, [activeKey]: value })}
                />

                <EditorThemeSidebar
                    themes={themes}
                    selectedThemeId={selectedThemeId}
                    onSelectTheme={setSelectedThemeId}
                />
            </div>
        </div>
    );
}
