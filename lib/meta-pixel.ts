/**
 * Meta Pixel event tracking utilities
 * Use these functions to track custom events throughout your application
 */

declare global {
  interface Window {
    fbq: any;
  }
}

/**
 * Track a standard Meta Pixel event
 * @param eventName - The name of the event (e.g., 'ViewContent', 'AddToCart', 'Purchase')
 * @param parameters - Optional parameters for the event
 */
export function trackMetaEvent(
  eventName: string,
  parameters?: Record<string, any>
) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, parameters);
  }
}

/**
 * Track a custom Meta Pixel event
 * @param eventName - The name of the custom event
 * @param parameters - Optional parameters for the event
 */
export function trackMetaCustomEvent(
  eventName: string,
  parameters?: Record<string, any>
) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", eventName, parameters);
  }
}

/**
 * Track when a user views a product
 * @param productName - Name of the product
 * @param productId - ID of the product
 * @param value - Value in dollars (will be converted to cents for Meta)
 * @param currency - Currency code (default: 'USD')
 */
export function trackViewContent(
  productName: string,
  productId: string,
  value?: number,
  currency: string = "USD"
) {
  trackMetaEvent("ViewContent", {
    content_name: productName,
    content_ids: [productId],
    content_type: "product",
    value: value,
    currency: currency,
  });
}

/**
 * Track when a user adds a product to cart
 * @param productName - Name of the product
 * @param productId - ID of the product
 * @param value - Value in dollars
 * @param currency - Currency code (default: 'USD')
 */
export function trackAddToCart(
  productName: string,
  productId: string,
  value: number,
  currency: string = "USD"
) {
  trackMetaEvent("AddToCart", {
    content_name: productName,
    content_ids: [productId],
    content_type: "product",
    value: value,
    currency: currency,
  });
}

/**
 * Track when a user initiates checkout
 * @param value - Total value in dollars
 * @param currency - Currency code (default: 'USD')
 * @param numItems - Number of items in cart
 */
export function trackInitiateCheckout(
  value: number,
  currency: string = "USD",
  numItems?: number
) {
  trackMetaEvent("InitiateCheckout", {
    value: value,
    currency: currency,
    num_items: numItems,
  });
}

/**
 * Track when a user completes a purchase
 * @param value - Total value in dollars
 * @param currency - Currency code (default: 'USD')
 * @param orderId - Unique order ID
 * @param contentIds - Array of product IDs purchased
 */
export function trackPurchase(
  value: number,
  currency: string = "USD",
  orderId?: string,
  contentIds?: string[]
) {
  trackMetaEvent("Purchase", {
    value: value,
    currency: currency,
    content_type: "product",
    content_ids: contentIds,
    order_id: orderId,
  });
}

/**
 * Track when a user signs up
 * @param method - Registration method (e.g., 'email', 'google')
 */
export function trackCompleteRegistration(method?: string) {
  trackMetaEvent("CompleteRegistration", {
    status: "completed",
    registration_method: method,
  });
}

/**
 * Track when a user submits a lead form
 * @param contentName - Name of the form or lead type
 */
export function trackLead(contentName?: string) {
  trackMetaEvent("Lead", {
    content_name: contentName,
  });
}

/**
 * Track when a user searches
 * @param searchString - The search query
 */
export function trackSearch(searchString: string) {
  trackMetaEvent("Search", {
    search_string: searchString,
  });
}
