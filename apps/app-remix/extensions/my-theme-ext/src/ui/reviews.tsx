// src/ui/reviews.tsx

/** @jsxImportSource preact */
import { h } from "preact";

interface ReviewsProps {
    product: {
        id: string;
        handle: string;
        title: string;
        url?: string;
        image?: string;
        images?: { url: string }[];
        metafields?: any;
        reviews?: {
            avgRating?: string;
            numReviews?: string;
        };
    };
    reviewsApp: string | null;
    yotpoId?: string;
}

export function Reviews({ product, reviewsApp, yotpoId }: ReviewsProps) {
    if (!reviewsApp) return null;

    // Normalize to lowercase for case-insensitive matching
    const app = reviewsApp.toLowerCase();

    const productUrl = product.url?.startsWith("http")
        ? product.url
        : `${typeof window !== "undefined" ? window.location.origin : ""}${product.url || ""}`;

    return (
        <div class="sw-card__reviews">
            {app === 'judge-me' && (
                <div class="jdgm-badge-placeholder" data-handle={product.handle} />
            )}

            {app === 'okendo' && (
                <div
                    data-oke-star-rating="true"
                    data-oke-reviews-product-id={`shopify-${product.id}`}
                />
            )}

            {app === 'yotpo' && (
                <div
                    class="yotpo-widget-instance"
                    data-yotpo-instance-id={yotpoId || "1254551"}
                    data-yotpo-product-id={product.id}
                    data-yotpo-name={product.title}
                    data-yotpo-url={productUrl}
                    data-yotpo-image-url={product.image || product.images?.[0]?.url}
                />
            )}

            {app === 'stamped' && (
                <span class="stamped-product-reviews-badge" data-id={product.id} />
            )}

            {app === 'growave' && (
                <div
                    class="gw-rv-listing-average-placeholder"
                    data-gw-product-id={product.id}
                    style={{ display: "block" }}
                />
            )}

            {app === 'loox' && (
                <div
                    class="loox-rating"
                    data-id={product.id}
                    data-rating={product.reviews?.avgRating || product.metafields?.reviews?.avg_rating || ""}
                    data-raters={product.reviews?.numReviews || product.metafields?.reviews?.num_reviews || ""}
                />
            )}
        </div>
    );
}
