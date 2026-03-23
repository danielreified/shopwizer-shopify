// app/gql/webpixel.server.ts

// Singular query: returns the pixel for *your app* on this store
export const WEBPIXEL_Q = /* GraphQL */ `
  query WebPixel {
    webPixel {
      id
      settings
    }
  }
`;

// Create: activate your web pixel extension for this store
export const WEBPIXEL_CREATE = /* GraphQL */ `
  mutation WebPixelCreate($webPixel: WebPixelInput!) {
    webPixelCreate(webPixel: $webPixel) {
      userErrors { field message code }
      webPixel { id settings }
    }
  }
`;

// Update existing pixel’s settings
export const WEBPIXEL_UPDATE = /* GraphQL */ `
  mutation WebPixelUpdate($id: ID!, $webPixel: WebPixelInput!) {
    webPixelUpdate(id: $id, webPixel: $webPixel) {
      userErrors { field message code }
      webPixel { id settings }
    }
  }
`;
