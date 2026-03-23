// src/ui/QuickBuyModal.tsx

/** @jsxImportSource preact */
import { h, Fragment } from "preact";
import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import { createPortal } from "preact/compat";
import { formatMoney } from "../core/utils/formatMoney";
import { themeBridge } from "../core/theme/themeBridge";

interface Variant {
    id: number;
    title: string;
    price: number;
    compare_at_price: number | null;
    available: boolean;
    featured_image: { src: string } | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
}

interface ProductData {
    id: number;
    title: string;
    handle: string;
    vendor: string;
    images: string[];
    options: { name: string; position: number; values: string[] }[];
    variants: Variant[];
}

interface QuickBuyModalProps {
    product: { handle: string; id: number; title: string };
    moneyFormat?: string;
    onClose: () => void;
    onAddToCart?: (variantId: number, quantity: number) => void;
}

/**
 * Generate a Shopify CDN image URL at a specific width.
 */
function getShopifyImageUrl(src: string, width: number): string {
    if (!src) return "";
    const hasQuery = src.includes("?");
    const separator = hasQuery ? "&" : "?";
    return `${src}${separator}width=${width}`;
}

export function QuickBuyModal({
    product,
    moneyFormat = "${{amount}}",
    onClose,
    onAddToCart,
}: QuickBuyModalProps) {
    const [productData, setProductData] = useState<ProductData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selected options: { "Color": "Black", "Size": "M" }
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [addSuccess, setAddSuccess] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);

    // Fetch full product data
    useEffect(() => {
        if (!product?.handle) return;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/products/${product.handle}.js`);
                if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);
                const data: ProductData = await res.json();
                setProductData(data);

                // Initialize selected options with first available variant's options
                const firstAvailable = data.variants.find((v) => v.available) || data.variants[0];
                if (firstAvailable && data.options) {
                    const initial: Record<string, string> = {};
                    data.options.forEach((opt, idx) => {
                        const optionKey = `option${idx + 1}` as "option1" | "option2" | "option3";
                        initial[opt.name] = firstAvailable[optionKey] || opt.values[0];
                    });
                    setSelectedOptions(initial);
                }
            } catch (err: any) {
                setError(err.message || "Failed to load product");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [product?.handle]);

    // Find the currently selected variant
    const selectedVariant = productData?.variants.find((v: Variant) => {
        if (!productData.options || productData.options.length === 0) return true;
        return productData.options.every((opt: any, idx: number) => {
            const optionKey = `option${idx + 1}` as "option1" | "option2" | "option3";
            return v[optionKey] === selectedOptions[opt.name];
        });
    });

    // Get current image (variant image or first product image)
    const currentImage =
        selectedVariant?.featured_image?.src ||
        productData?.images?.[0] ||
        "";

    // Handle option selection
    const handleOptionChange = (optionName: string, value: string) => {
        setSelectedOptions((prev: Record<string, string>) => ({ ...prev, [optionName]: value }));
    };

    // Handle add to cart
    const handleAddToCart = async () => {
        if (!selectedVariant || !selectedVariant.available) return;

        setAddingToCart(true);
        try {
            const res = await fetch("/cart/add.js", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedVariant.id,
                    quantity,
                }),
            });

            if (!res.ok) throw new Error("Failed to add to cart");
            const data = await res.json();

            // Refresh theme UI via ThemeBridge
            themeBridge.notifyCartUpdate();

            // Fire analytics event
            if (onAddToCart) {
                onAddToCart(selectedVariant.id, quantity);
            }

            setAddSuccess(true);
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (err) {
            console.error("Add to cart error:", err);
        } finally {
            setAddingToCart(false);
        }
    };

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Focus trap
    useEffect(() => {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0] as HTMLElement;
        const lastEl = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;
            if (e.shiftKey && document.activeElement === firstEl) {
                e.preventDefault();
                lastEl?.focus();
            } else if (!e.shiftKey && document.activeElement === lastEl) {
                e.preventDefault();
                firstEl?.focus();
            }
        };

        window.addEventListener("keydown", handleTab);
        firstEl?.focus();

        return () => window.removeEventListener("keydown", handleTab);
    }, [loading]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const isSingleVariant = productData?.variants.length === 1;
    const isOnSale = selectedVariant?.compare_at_price && selectedVariant.compare_at_price > selectedVariant.price;

    const modalContent = (
        <div className="sw-modal__backdrop" onClick={onClose}>
            <div
                ref={modalRef}
                className="sw-modal__container"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sw-modal-title"
            >
                {/* Close button */}
                <button className="sw-modal__close" onClick={onClose} aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {loading ? (
                    <div className="sw-modal__loading">
                        <div className="sw-modal__spinner" />
                    </div>
                ) : error ? (
                    <div className="sw-modal__error">{error}</div>
                ) : productData ? (
                    <Fragment>
                        {/* Image Section */}
                        <div className="sw-modal__image">
                            {currentImage && (
                                <img
                                    src={getShopifyImageUrl(currentImage, 600)}
                                    alt={productData.title}
                                    width={600}
                                    height={600}
                                />
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="sw-modal__details">
                            {productData.vendor && (
                                <div className="sw-modal__vendor">{productData.vendor}</div>
                            )}

                            <h2 id="sw-modal-title" className="sw-modal__title">
                                {productData.title}
                            </h2>

                            <div className="sw-modal__price">
                                <span className="sw-modal__price-current">
                                    {formatMoney(selectedVariant?.price || 0, moneyFormat)}
                                </span>
                                {isOnSale && selectedVariant?.compare_at_price && (
                                    <span className="sw-modal__price-compare">
                                        {formatMoney(selectedVariant.compare_at_price, moneyFormat)}
                                    </span>
                                )}
                            </div>

                            {/* Option Selectors */}
                            {!isSingleVariant && productData.options.map((option) => (
                                <div className="sw-modal__option" key={option.name}>
                                    <label className="sw-modal__option-label">
                                        {option.name}: <strong>{selectedOptions[option.name]}</strong>
                                    </label>
                                    <div className="sw-modal__option-values">
                                        {option.values.map((value: string) => {
                                            const isSelected = selectedOptions[option.name] === value;
                                            // Check if this option value is available
                                            const isAvailable = productData.variants.some((v: Variant) => {
                                                const optionIdx = productData.options.findIndex((o: any) => o.name === option.name);
                                                const optionKey = `option${optionIdx + 1}` as "option1" | "option2" | "option3";
                                                return v[optionKey] === value && v.available;
                                            });

                                            const isColorOption = option.name.toLowerCase() === "color" || option.name.toLowerCase() === "colour";

                                            return (
                                                <button
                                                    key={value}
                                                    className={`sw-modal__option-btn ${isSelected ? "is-selected" : ""} ${!isAvailable ? "is-disabled" : ""} ${isColorOption ? "is-swatch" : ""}`}
                                                    onClick={() => handleOptionChange(option.name, value)}
                                                    disabled={!isAvailable}
                                                    title={value}
                                                >
                                                    {isColorOption ? (
                                                        <span className="sw-modal__swatch" style={{ backgroundColor: value.toLowerCase() }} />
                                                    ) : (
                                                        value
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Availability */}
                            <div className="sw-modal__availability">
                                {selectedVariant?.available ? (
                                    <span className="sw-modal__in-stock">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.78 5.72a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L4.22 8.78a.75.75 0 0 1 1.06-1.06l1.72 1.72 3.72-3.72a.75.75 0 0 1 1.06 0z" />
                                        </svg>
                                        In stock
                                    </span>
                                ) : (
                                    <span className="sw-modal__sold-out">Sold out</span>
                                )}
                            </div>

                            {/* Quantity Selector */}
                            <div className="sw-modal__quantity">
                                <button
                                    className="sw-modal__qty-btn"
                                    onClick={() => setQuantity((q: number) => Math.max(1, q - 1))}
                                    aria-label="Decrease quantity"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    className="sw-modal__qty-input"
                                    value={quantity}
                                    min={1}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt((e.target as HTMLInputElement).value) || 1))}
                                />
                                <button
                                    className="sw-modal__qty-btn"
                                    onClick={() => setQuantity((q: number) => q + 1)}
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                className={`sw-modal__add-btn ${addingToCart ? "is-loading" : ""} ${addSuccess ? "is-success" : ""}`}
                                onClick={handleAddToCart}
                                disabled={!selectedVariant?.available || addingToCart}
                            >
                                {addSuccess ? (
                                    <Fragment>
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" />
                                        </svg>
                                        Added!
                                    </Fragment>
                                ) : addingToCart ? (
                                    <span className="sw-modal__btn-spinner" />
                                ) : selectedVariant?.available ? (
                                    "Add to Cart"
                                ) : (
                                    "Sold Out"
                                )}
                            </button>
                        </div>
                    </Fragment>
                ) : null}
            </div>
        </div>
    );

    // Render via portal to body
    return createPortal(modalContent, document.body);
}
