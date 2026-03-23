export const SHOP_INFO_QUERY = `#graphql
  query ShopInfo {
    shop {
      id
      name
      email
      myshopifyDomain
      primaryDomain { url }
      currencyCode
      ianaTimezone
      billingAddress { countryCodeV2 }
      plan { displayName partnerDevelopment }
    }
  }
`;
