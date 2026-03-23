/**
 * themeBridge.ts - Universal connector for Shopify Theme integrations.
 * Supports Horizon 2025 and Dawn themes.
 */

import { createDebugger } from "../utils/debug";

const debug = createDebugger("[ThemeBridge]", false); // Set to true for debugging

interface ThemeUpdateOptions {
    openDrawer?: boolean;
}

export class ThemeBridge {
    private static instance: ThemeBridge | null = null;
    private isRefreshing: boolean = false;

    private constructor() {
        // Check if already initialized globally
        if ((window as any).__shopwiseThemeBridge) {
            return;
        }

        this.initEventListeners();
        (window as any).__shopwiseThemeBridge = this;
        debug.log("Initialized (singleton)");
    }

    public static getInstance(): ThemeBridge {
        // Return existing global instance if available
        if ((window as any).__shopwiseThemeBridge) {
            return (window as any).__shopwiseThemeBridge;
        }

        if (!ThemeBridge.instance) {
            ThemeBridge.instance = new ThemeBridge();
        }

        return ThemeBridge.instance;
    }

    private initEventListeners() {
        // Listen to CartEvents (from cartEvents.ts)
        window.addEventListener("SW:add", () => this.notifyCartUpdate());
        window.addEventListener("SW:update", () => this.notifyCartUpdate());
        window.addEventListener("SW:change", () => this.notifyCartUpdate());
        window.addEventListener("SW:clear", () => this.notifyCartUpdate());
    }

    public async notifyCartUpdate(_options: ThemeUpdateOptions = {}) {
        if (this.isRefreshing) return;
        this.isRefreshing = true;

        try {
            // Fetch actual cart to get correct item_count
            const cart = await fetch('/cart.js', {
                headers: { 'X-Shopwise-Ignore': 'true' }
            }).then(r => r.json()).catch(() => null);

            // Fire Horizon theme event with correct item count
            this.fireHorizonEvent(cart);

            // Notify Shopwise components
            document.dispatchEvent(new CustomEvent("shopwise:cart:changed", { detail: cart }));

        } catch (err) {
            debug.warn("Update failed:", err);
        } finally {
            this.isRefreshing = false;
        }
    }

    private fireHorizonEvent(cart: any) {
        const itemCount = cart?.item_count ?? 0;

        // Horizon 2025 uses this event pattern
        document.dispatchEvent(new CustomEvent('cart:update', {
            bubbles: true,
            detail: {
                data: {
                    itemCount: itemCount,
                    source: 'shopwise'
                }
            }
        }));
    }

    public destroy() {
        ThemeBridge.instance = null;
        delete (window as any).__shopwiseThemeBridge;
    }
}

export const themeBridge = ThemeBridge.getInstance();
