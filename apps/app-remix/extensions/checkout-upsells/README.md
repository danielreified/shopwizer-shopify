# Checkout Upsells Extension

Shows product recommendations during the Shopify checkout flow to increase Average Order Value (AOV).

## Features

- **Smart Recommendations**: Uses cart-based recommendations API
- **Add to Cart**: Customers can add products directly during checkout
- **Analytics**: Tracks views and clicks for reporting
- **Merchant Customizable**: Title, number of products, and add-to-cart toggle

## Extension Target

- `purchase.checkout.block.render` - Appears as a block during checkout

## Settings

| Setting | Type | Description |
|---------|------|-------------|
| `heading_title` | Text | Title displayed above recommendations |
| `products_to_show` | Number | Number of products (2-4) |
| `show_add_to_cart` | Boolean | Allow adding products during checkout |

## API

Calls: `/apps/sw/recs/{shop}/cart?ids={product_ids}`

Returns cart-based recommendations based on products in the current checkout.

## Analytics Events

- `sw_reco_view` - When recommendations are displayed
- `sw_reco_click` - When a product is clicked or added to cart
