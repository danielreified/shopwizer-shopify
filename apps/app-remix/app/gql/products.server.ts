import type { UserError } from "./common";

export const PRODUCT_CREATE = /* GraphQL */ `
  mutation ProductCreate($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        id
        title
        variants(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
export type ProductCreateVars = { product: { title: string } };
export type ProductCreateData = {
  productCreate: {
    product: {
      id: string;
      title: string;
      variants: { edges: { node: { id: string } }[] };
    } | null;
    userErrors: UserError[];
  };
};

export const UPDATE_VARIANT = /* GraphQL */ `
  mutation UpdateVariant(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        price
      }
      userErrors {
        field
        message
      }
    }
  }
`;
export type UpdateVariantVars = {
  productId: string;
  variants: { id: string; price: string }[];
};
export type UpdateVariantData = {
  productVariantsBulkUpdate: {
    productVariants: { id: string; price: string }[];
    userErrors: UserError[];
  };
};

export const PRODUCTS_BULK_SELECTION = `#graphql
{
  products(first: 10) {
    edges {
      node {
        id
        handle
        title
        vendor
        status
        productType
        tags
        descriptionHtml
        featuredImage { 
          id 
          url 
          altText 
          width 
          height 
        }
        options { 
          id 
          name 
          position 
          values 
        }
        images(first: 10) {
          edges { 
            node { 
              id 
              url 
              altText 
              width 
              height 
            } 
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              sku
              barcode
              price
              position
              title
              product { id }
              image { id url width height altText }
              selectedOptions { name value }
              inventoryQuantity
              inventoryItem { id sku }
            }
          }
        }
      }
    }
  }
}`;
