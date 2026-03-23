// src/ui/card.tsx

/** @jsxImportSource preact */
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { formatMoney } from "../core/utils/formatMoney";

/**
 * Generate a Shopify CDN image URL at a specific width.
 * Modern Shopify CDN uses ?width= or &width= query parameter.
 * Example: image.jpg?v=123 -> image.jpg?v=123&width=400
 */
function getShopifyImageUrl(src: string, width: number): string {
  if (!src) return "";

  // Check if URL already has query parameters
  const hasQuery = src.includes("?");
  const separator = hasQuery ? "&" : "?";

  return `${src}${separator}width=${width}`;
}

/**
 * Generate srcset for responsive images using Shopify CDN.
 * Uses width breakpoints matching Shopify's default theme pattern.
 */
function generateSrcSet(src: string): string {
  if (!src) return "";

  // Match Shopify's standard srcset widths
  const widths = [165, 360, 533, 720, 940, 1066];
  return widths
    .map((w) => `${getShopifyImageUrl(src, w)} ${w}w`)
    .join(", ");
}

interface CardProps {
  product: any;
  moneyFormat?: string;
  showVendor?: boolean;
  showPrice?: boolean;
  showComparePrice?: boolean;
  showSaleBadge?: boolean;
  showWishlist?: boolean;
  showReviews?: boolean;
  showQuickBuy?: boolean;
  imageRatio?: string;
  borderStyle?: string;
  cardRadius?: number;
  integrations?: { wishlist?: string; reviews?: string; yotpoId?: string };
  onQuickBuy?: (product: any) => void;
}

export function Card({
  product,
  moneyFormat = "${{amount}}",
  showVendor = false,
  showPrice = true,
  showComparePrice = true,
  showSaleBadge = true,
  showWishlist = true,
  showReviews = true,
  showQuickBuy = true,
  imageRatio = "auto",
  borderStyle = "solid",
  cardRadius = 12,
  integrations = {},
  onQuickBuy,
}: CardProps) {
  if (!product) return null;

  // Handle skeleton loading state
  if (product.skeleton) {
    return (
      <div
        className="sw-card sw-card--skeleton"
        style={{
          "--image-aspect-ratio": imageRatio,
          "--card-border-style": borderStyle,
          "--card-radius": `${cardRadius}px`,
        } as any}
      >
        <div className="sw-card__media-wrapper">
          <div className="sw-card__media sw-skel-shimmer"></div>
        </div>
        <div className="sw-card__body">
          <div className="sw-skel-line sw-skel-shimmer" style={{ width: "80%" }}></div>
          <div className="sw-skel-line sw-skel-line--short sw-skel-shimmer"></div>
        </div>
      </div>
    );
  }

  const firstImage = product?.images?.[0] || null;
  const variantId = product?.variants?.[0]?.id || product?.variant_id;
  const isOnSale = Boolean(product.compare_at_price) && product.compare_at_price > product.price;


  const productUrl = product.url?.startsWith("http")
    ? product.url
    : `${typeof window !== "undefined" ? window.location.origin : ""}${product.url || ""}`;

  // Get which apps to render from integrations (from API response)
  const wishlistApp = integrations?.wishlist?.toLowerCase() || null;
  const reviewsApp = integrations?.reviews?.toLowerCase() || null;

  useEffect(() => {
    // Keep empty or remove entirely if unused
  }, [reviewsApp]);



  return (
    <div
      className="sw-card"
      style={{
        "--image-aspect-ratio": imageRatio,
        "--card-border-style": borderStyle,
        "--card-radius": `${cardRadius}px`,
      } as any}
    >
      <div className="sw-card__media-wrapper">
        <a
          href={product.url}
          className="sw-card__media"
          draggable={false}
          onDragStart={(e: any) => e.preventDefault()}
        >
          {typeof firstImage === 'string' && firstImage && (
            <img
              src={getShopifyImageUrl(firstImage, 360)}
              srcSet={generateSrcSet(firstImage)}
              sizes="(min-width: 750px) calc(25vw - 10px), 50vw"
              alt={product.title}
              width={360}
              height={450}
              loading="lazy"
              decoding="async"
              draggable={false}
              onDragStart={(e: any) => e.preventDefault()}
            />
          )}
        </a>

        {/* Sale badge */}
        {showSaleBadge && isOnSale && (
          <span className="sw-card__badge sw-card__badge--sale">Sale</span>
        )}

        {/* Wishlist - only render enabled app */}
        {showWishlist && wishlistApp && (
          <div className="sw-card__wishlist">
            {wishlistApp === 'swym' && (
              <button
                aria-label="Add to Wishlist"
                data-with-epi="true"
                className={`swym-button swym-add-to-wishlist-view-product product_${product.id}`}
                data-swaction="addToWishlist"
                data-product-id={product.id}
                data-variant-id={variantId}
                data-product-url={productUrl}
              />
            )}

            {wishlistApp === 'growave' && (
              <div
                className="gw-add-to-wishlist-product-card-placeholder"
                data-gw-product-id={product.id}
                data-gw-variant-id={variantId}
              />
            )}

            {wishlistApp === 'wishlist-king' && (
              <div
                className="wk-button-product-card"
                data-wk-product-id={product.id}
                data-wk-variant-id={variantId}
              />
            )}

            {wishlistApp === 'hulk' && (
              <div
                className="wishlist-btn grid-wishlist-btn"
                data-wishlist="true"
                data-added="false"
                data-proid={product.id}
                data-varid={variantId}
                aria-label="Add to Wishlist"
              />
            )}

            {wishlistApp === 'wishlist-hero' && (
              <div
                className="wishlist-hero-custom-button wishlisthero-floating"
                data-wlh-id={product.id}
                data-wlh-link={productUrl}
                data-wlh-variantid={variantId}
                data-wlh-price={(product.price / 100).toFixed(2)}
                data-wlh-name={product.title}
                data-wlh-image={product.images?.[0] || ""}
                data-wlh-mode="icon_only"
              />
            )}
          </div>
        )}

        {/* Quick Buy Button */}
        {showQuickBuy && onQuickBuy && !product.skeleton && (
          <button
            className="sw-card__quick-buy"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickBuy(product);
            }}
            aria-label="Quick add to cart"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </button>
        )}
      </div>

      <div className="sw-card__body">
        {showVendor && Boolean(product.vendor) && (
          <div className="sw-card__vendor">{product.vendor}</div>
        )}

        <h3 className="sw-card__title">
          <a href={product.url} draggable={false}>{product.title}</a>
        </h3>

        {showPrice && (
          <div className="sw-card__price">
            <span className="sw-card__price-current">
              {formatMoney(product.price, moneyFormat)}
            </span>

            {showComparePrice && isOnSale && (
              <span className="sw-card__price-compare">
                {formatMoney(product.compare_at_price, moneyFormat)}
              </span>
            )}
          </div>
        )}

        {/* Reviews - only render enabled app */}
        {showReviews && reviewsApp && (
          <div className="sw-card__reviews">
            {reviewsApp === 'judge-me' && (
              <div className="jdgm-badge-placeholder" data-handle={product.handle} />
            )}

            {reviewsApp === 'okendo' && (
              <div
                data-oke-star-rating="true"
                data-oke-reviews-product-id={`shopify-${product.id}`}
              />
            )}

            {reviewsApp === 'yotpo' && (
              <div
                className="yotpo-widget-instance"
                data-yotpo-instance-id={integrations?.yotpoId || "1254551"}
                data-yotpo-product-id={product.id}
                data-yotpo-name={product.title}
                data-yotpo-url={productUrl}
                data-yotpo-image-url={product.image || product.images?.[0]?.url}
              />
            )}

            {reviewsApp === 'stamped' && (
              <span className="stamped-product-reviews-badge" data-id={product.id} />
            )}

            {reviewsApp === 'growave' && (
              <div
                className="gw-rv-listing-average-placeholder"
                data-gw-product-id={product.id}
                style={{ display: "block" }}
              />
            )}

            {reviewsApp === 'loox' && (
              <div
                className="loox-rating"
                data-id={product.id}
                data-rating={product.metafields?.reviews?.avg_rating || ""}
                data-raters={product.metafields?.reviews?.num_reviews || ""}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}