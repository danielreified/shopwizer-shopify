/** @jsxImportSource preact */
import { h, render } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { fetchProductByHandle } from "./core/fetch/product";
import { publishViewed, publishClicked } from "./core/analytics/index";
import { observeViewOnce } from "./core/analytics/viewObserver";
import { QuickBuyModal } from "./ui/QuickBuyModal";
import { Reviews } from "./ui/reviews";

interface BundleProduct {
    id: string; // The numeric ID from our DB (for tracking)
    handle: string;
    title: string;
    url: string;
    price: string;
    compareAtPrice: string | null;
    imageUrl: string | null;
    reviews?: {
        avgRating: string;
        numReviews: string;
    };
}

interface BundleSettings {
    shop: string;
    productId: string;
    productsToShow: number;
    headingTitle: string;
    moneyFormat: string;
    showReviews: boolean;
    layout: 'stack' | 'carousel';
}

interface BundleVariant {
    variant: string;
    weight: number;
    slate_id: string;
    p: string;
    ps: string;
    results: { handle: string; reviews?: any }[];
}

// ============================================================
// BUNDLE ITEM COMPONENT (horizontal row)
// ============================================================

function BundleItem({
    product,
    onClick,
    onQuickBuy,
    showReviews,
    integrations,
    layout,
    skeleton = false
}: {
    product?: BundleProduct;
    onClick?: () => void;
    onQuickBuy?: (product: BundleProduct) => void;
    showReviews?: boolean;
    integrations?: any;
    layout: 'stack' | 'carousel';
    skeleton?: boolean;
}) {
    const isLoading = skeleton || !product;

    // Same container structure always - just swap inner content
    return (
        <div className={`sw-bundle__item-container sw-bundle__item--${layout}`}>
            {isLoading ? (
                // Skeleton content
                <div className="sw-bundle__item">
                    <div className="sw-bundle__item-image-wrap">
                        <div className="sw-bundle__item-image sw-skel-shimmer"></div>
                    </div>
                    <div className="sw-bundle__item-info">
                        <div className="sw-bundle__item-title-skeleton sw-skel-shimmer"></div>
                        <div className="sw-bundle__item-title-skeleton sw-bundle__item-title-skeleton--short sw-skel-shimmer"></div>
                    </div>
                    <div className="sw-bundle__item-price-wrap">
                        <div className="sw-bundle__item-price-skeleton sw-skel-shimmer"></div>
                    </div>
                </div>
            ) : (
                // Real content
                <>
                    <a
                        href={product.url}
                        className="sw-bundle__item"
                        draggable={false}
                        onClick={() => onClick?.()}
                    >
                        <div className="sw-bundle__item-image-wrap">
                            <div className="sw-bundle__item-image">
                                {product.imageUrl && (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.title}
                                        loading="lazy"
                                    />
                                )}
                            </div>
                            {layout === 'carousel' && (
                                <button
                                    className="sw-bundle__quick-buy"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onQuickBuy?.(product);
                                    }}
                                    aria-label="Quick Buy"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="sw-bundle__item-info">
                            <div className="sw-bundle__item-title">{product.title}</div>
                            {showReviews && (
                                <Reviews
                                    product={product}
                                    reviewsApp={integrations?.reviews}
                                    yotpoId={integrations?.yotpoId}
                                />
                            )}
                        </div>
                        <div className="sw-bundle__item-price-wrap">
                            <div className="sw-bundle__item-prices">
                                <div className="sw-bundle__item-price">{product.price}</div>
                                {product.compareAtPrice && (
                                    <div className="sw-bundle__item-compare-price">{product.compareAtPrice}</div>
                                )}
                            </div>
                        </div>
                    </a>
                    {layout === 'stack' && (
                        <button
                            className="sw-bundle__quick-buy"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onQuickBuy?.(product);
                            }}
                            aria-label="Quick Buy"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

// ============================================================
// MAIN BUNDLE WIDGET
// ============================================================

function BundleWidget({ settings }: { settings: BundleSettings }) {
    const [variants, setVariants] = useState<BundleVariant[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [products, setProducts] = useState<BundleProduct[]>([]);
    const [integrations, setIntegrations] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);

    const mountRef = useRef<HTMLDivElement>(null);

    // Initial Fetch: Get all variants AND integrations
    useEffect(() => {
        async function fetchBundleData() {
            try {
                const apiUrl = `/apps/sw/recs/${settings.shop}/bundles/${settings.productId}`;
                const integrationsUrl = `/apps/sw/integrations/${settings.shop}`;

                // Fetch variants and integrations in parallel (like rails do)
                const [variantsRes, integrationsRes] = await Promise.all([
                    fetch(apiUrl),
                    fetch(integrationsUrl).catch(() => null),
                ]);

                if (!variantsRes.ok) {
                    throw new Error(`API error: ${variantsRes.status}`);
                }

                const variantsData = await variantsRes.json() as { variants: BundleVariant[] };

                // Parse integrations (same pattern as rails)
                let integrationsData: any = {};
                if (integrationsRes?.ok) {
                    const intRes = await integrationsRes.json();
                    integrationsData = intRes.integrations || {};
                }

                if (!variantsData.variants || variantsData.variants.length === 0) {
                    setVariants([]);
                    setLoading(false);
                    return;
                }

                setVariants(variantsData.variants);
                setIntegrations(integrationsData);

                // Initial selection based on weight
                const initialIndex = getWeightedRandomIndex(variantsData.variants);
                setCurrentIndex(initialIndex);
            } catch (err) {
                console.error("[Bundle Widget] Error fetching bundle data:", err);
                setError((err as Error).message);
                setLoading(false);
            }
        }

        fetchBundleData();
    }, [settings.shop, settings.productId]);

    // Update products when active variant changes
    useEffect(() => {
        const activeVariant = variants[currentIndex];
        if (!activeVariant) return;

        async function fetchVariantProducts() {
            setLoading(true);
            try {
                const handles = activeVariant.results
                    .slice(0, settings.productsToShow)
                    .map((r: any) => r.handle);

                console.log("[Bundle] Fetching handles:", handles);

                const productPromises = handles.map(async (handle: string) => {
                    try {
                        console.log("[Bundle] Fetching product:", handle);
                        const product = await fetchProductByHandle(handle);
                        console.log("[Bundle] Got product:", handle, product ? "OK" : "NULL");
                        if (!product) return null;

                        const imageUrl = product.images?.[0] || product.featured_image || null;
                        const priceInCents = product.price || 0;
                        const compareAtPriceInCents = product.compare_at_price || 0;

                        return {
                            id: String(product.id),
                            handle: (product as any).handle,
                            title: (product as any).title,
                            url: (product as any).url || `/products/${(product as any).handle}`,
                            price: formatMoney(priceInCents, settings.moneyFormat),
                            compareAtPrice: compareAtPriceInCents > priceInCents
                                ? formatMoney(compareAtPriceInCents, settings.moneyFormat)
                                : null,
                            imageUrl: imageUrl,
                        } as BundleProduct;
                    } catch (err) {
                        console.error("[Bundle] Error fetching product:", handle, err);
                        return null;
                    }
                });

                const fetchedProducts = (await Promise.all(productPromises)).filter(Boolean) as BundleProduct[];

                // Attach reviews from variant results
                const productsWithReviews = fetchedProducts.map(p => {
                    const variantResult = activeVariant.results.find(r => r.handle === p.handle);
                    return {
                        ...p,
                        reviews: variantResult?.reviews
                    };
                });

                console.log("[Bundle] Fetched products count:", fetchedProducts.length);
                setProducts(productsWithReviews);
            } catch (err) {
                console.error("[Bundle Widget] Error fetching products:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchVariantProducts();
    }, [currentIndex, variants, settings.productsToShow, settings.moneyFormat]);

    // View tracking logic
    useEffect(() => {
        if (!mountRef.current || !products.length) return;
        const activeVariant = variants[currentIndex];
        if (!activeVariant) return;

        // Reset intersection observer tracking for this mount element if we want to track every variant view
        // But observeViewOnce is usually fine for the initial load. 
        // For cycling, we want to publish a view event every time the variant changes while visible.

        publishViewed({
            rail: "bundles",
            placement: "pdp_bundles",
            slateId: activeVariant.slate_id,
        });
    }, [products, currentIndex, variants]);

    const activeVariant = variants[currentIndex];

    // Navigation handlers
    const nextVariant = (e: h.JSX.TargetedMouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % variants.length);
    };

    const prevVariant = (e: h.JSX.TargetedMouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + variants.length) % variants.length);
    };

    // Loading state - show skeleton in same structure
    const isInitialLoad = loading && variants.length === 0;

    // Error or empty state - hide widget
    if (error || (variants.length === 0 && !loading)) {
        return null;
    }

    // ALWAYS use the same slot count - never change container structure
    const slotCount = settings.productsToShow;

    return (
        <div className={`sw-bundle sw-bundle--${settings.layout}`} ref={mountRef}>
            <div className="sw-bundle__header">
                <div className="sw-bundle__header-left">
                    {isInitialLoad ? (
                        <div className="sw-bundle__title-skeleton sw-skel-shimmer"></div>
                    ) : (
                        <h3 className="sw-bundle__title">{settings.headingTitle}</h3>
                    )}
                </div>
                {!isInitialLoad && variants.length > 1 && (
                    <div className="sw-bundle__nav">
                        <button className="sw-bundle__nav-btn" onClick={prevVariant} aria-label="Previous Bundle">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <span className="sw-bundle__nav-info">{currentIndex + 1} / {variants.length}</span>
                        <button className="sw-bundle__nav-btn" onClick={nextVariant} aria-label="Next Bundle">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                )}
            </div>
            <div className="sw-bundle__items">
                {Array.from({ length: slotCount }).map((_, index) => {
                    const product = isInitialLoad ? undefined : products[index];

                    return (
                        <BundleItem
                            key={index}
                            product={product}
                            layout={settings.layout}
                            skeleton={!product}
                            showReviews={settings.showReviews}
                            integrations={integrations}
                            onQuickBuy={product ? (p) => {
                                setQuickBuyProduct(p);
                                if (activeVariant) {
                                    publishClicked({
                                        rail: "bundles",
                                        placement: "pdp_bundles",
                                        productId: p.id,
                                        srcPid: settings.productId,
                                        slateId: activeVariant.slate_id,
                                        action: 'quick_buy_open',
                                    });
                                }
                            } : undefined}
                            onClick={product ? () => {
                                if (!activeVariant) return;
                                publishClicked({
                                    rail: "bundles",
                                    placement: "pdp_bundles",
                                    // @ts-ignore - variant is custom data
                                    variant: activeVariant.variant,
                                    productId: product.id,
                                    srcPid: settings.productId,
                                    slateId: activeVariant.slate_id,
                                    p: activeVariant.p,
                                    ps: activeVariant.ps,
                                });
                            } : undefined}
                        />
                    );
                })}
            </div>

            {quickBuyProduct && (
                <QuickBuyModal
                    product={{
                        handle: quickBuyProduct.handle,
                        id: parseInt(quickBuyProduct.id, 10),
                        title: quickBuyProduct.title
                    }}
                    moneyFormat={settings.moneyFormat}
                    onClose={() => setQuickBuyProduct(null)}
                    onAddToCart={(variantId, quantity) => {
                        if (activeVariant) {
                            publishClicked({
                                rail: "bundles",
                                placement: "pdp_bundles",
                                productId: quickBuyProduct.id,
                                variantId,
                                quantity,
                                action: 'quick_buy_add',
                            });
                        }
                    }}
                />
            )}
        </div>
    );
}

// ============================================================
// UTILITIES
// ============================================================

function formatMoney(cents: number, moneyFormat: string): string {
    const amount = (cents / 100).toFixed(2);
    const amountNoDecimals = Math.round(cents / 100).toString();
    const amountWithComma = amount.replace(".", ",");

    return moneyFormat
        .replace("{{amount}}", amount)
        .replace("{{amount_no_decimals}}", amountNoDecimals)
        .replace("{{amount_with_comma_separator}}", amountWithComma)
        .replace("{{amount_no_decimals_with_comma_separator}}", amountNoDecimals);
}

function getWeightedRandomIndex<T extends { weight: number }>(items: T[]): number {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
        if (r < items[i].weight) return i;
        r -= items[i].weight;
    }
    return 0;
}

function log(...args: any[]) {
    console.log("%c[Bundles]", "color: #3b82f6; font-weight: bold;", ...args);
}

// ============================================================
// MOUNT
// ============================================================

function mount() {
    document.querySelectorAll<HTMLElement>('.sw-reco[data-recommender="bundles"]').forEach((el) => {
        const settings: BundleSettings = {
            shop: el.dataset.shop || "",
            productId: el.dataset.productId || "",
            productsToShow: parseInt(el.dataset.productsToShow || "3", 10),
            headingTitle: el.dataset.headingTitle || "Complete the Look",
            moneyFormat: el.dataset.moneyFormat || "R {{amount}}",
            showReviews: el.dataset.showReviews === "true",
            layout: (el.dataset.desktopLayout as any) || 'stack',
        };

        if (!settings.shop || !settings.productId) {
            console.warn("[Bundle Widget] Missing shop or productId");
            return;
        }

        render(<BundleWidget settings={settings} />, el);
    });
}

// Run on DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
} else {
    mount();
}

export { BundleWidget };
