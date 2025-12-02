"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function CheckoutForm({ customerEmail, shippingAddress, orderId }: { customerEmail: string; shippingAddress: any; orderId: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store/orders/confirmation${orderId ? `?order_id=${orderId}` : ""}`,
        receipt_email: customerEmail || undefined,
        shipping: shippingAddress
          ? {
              name: shippingAddress.name || customerEmail || "Customer",
              phone: shippingAddress.phone,
              address: {
                city: shippingAddress.city,
                country: shippingAddress.country,
                line1: shippingAddress.line1,
                line2: shippingAddress.line2,
                postal_code: shippingAddress.postal_code,
                state: shippingAddress.state,
              },
            }
          : undefined,
      },
    });

    if (error) {
      console.error("Stripe confirmPayment error:", error);
      setError(error.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shipping Address */}
      {/* Payment */}
      <div>
        <h3 className="font-bold text-lg uppercase tracking-wider mb-4">
          Payment Information
        </h3>
        <PaymentElement />
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert-error">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn w-full text-base py-4"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="spinner border-2"></div>
            Processing...
          </span>
        ) : (
          "Place Order"
        )}
      </button>

      <p className="text-xs text-neutral-600 text-center">
        Your payment information is encrypted and secure. Made to order with 7–10 day production time.
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderTotals, setOrderTotals] = useState<{
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState<any>({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });
  const [addressComplete, setAddressComplete] = useState(false);
  const [shouldCreateIntent, setShouldCreateIntent] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: string;
    value: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }

    setValidatingDiscount(true);
    setDiscountError(null);

    try {
      const response = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountCode.trim(),
          email: customerEmail
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedDiscount(data.discount);
        setDiscountError(null);
        // Reset payment intent so it recalculates with discount
        setClientSecret(null);
        setShouldCreateIntent(true);
      } else {
        setDiscountError(data.error || "Invalid discount code");
        setAppliedDiscount(null);
      }
    } catch (err) {
      console.error("Discount validation error:", err);
      setDiscountError("Failed to validate discount code");
      setAppliedDiscount(null);
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError(null);
    // Reset payment intent so it recalculates without discount
    setClientSecret(null);
    setShouldCreateIntent(true);
  };

  const updateAddress = (field: string, value: string) => {
    const updated = { ...shippingAddress, [field]: value };
    setShippingAddress(updated);
    const required = ["name", "line1", "city", "state", "postal_code", "country"];
    
    // Validate postal code has at least 5 digits
    const hasValidZip = updated.postal_code && updated.postal_code.replace(/\D/g, '').length >= 5;
    
    // Validate state is 2 characters (convert to uppercase)
    if (field === 'state') {
      updated.state = value.toUpperCase();
      setShippingAddress(updated);
    }
    
    const isComplete = required.every((k) => (updated[k] || "").trim().length > 0) && hasValidZip;
    setAddressComplete(isComplete);
    
    // Debug logging
    console.log(`Address field updated: ${field} = ${value}`);
    console.log("Current address:", updated);
    console.log("Has valid zip?", hasValidZip, "(length:", updated.postal_code?.replace(/\D/g, '').length, ")");
    console.log("Address complete?", isComplete);
    
    // Trigger intent creation when address becomes complete
    if (isComplete && !clientSecret) {
      console.log("✅ Address is complete! Triggering payment intent creation...");
      setShouldCreateIntent(true);
    }
  };

  useEffect(() => {
    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);

    if (cart.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(false);
  }, []);

  // Create payment intent once we have cart + address + email
  useEffect(() => {
    if (loading) return;
    if (!cartItems.length) return;
    if (!addressComplete || !shippingAddress || !customerEmail) return;
    if (clientSecret || intentLoading) return;
    if (!shouldCreateIntent) return; // Only trigger when explicitly set

    setIntentLoading(true);
    setError(null);
    setShouldCreateIntent(false); // Reset trigger
    
    console.log("=== CREATING PAYMENT INTENT ===");
    console.log("Sending cart:", cartItems);
    console.log("Sending address:", shippingAddress);
    console.log("Sending email:", customerEmail);

    fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cart: cartItems,
        address: shippingAddress,
        email: customerEmail,
        discount: appliedDiscount,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Payment intent response:", data); // Debug log
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          if (data.orderId) {
            setOrderId(data.orderId);
          }
          
          if (data.totals) {
            console.log("Received totals:", data.totals); // Debug log
            setOrderTotals({
              subtotal: data.totals.subtotal_cents / 100,
              shipping: data.totals.shipping_cents / 100,
              tax: data.totals.tax_cents / 100,
              total: data.totals.total_cents / 100,
            });
          }
        } else {
          setError(data.error || "Failed to initialize checkout");
        }
      })
      .catch((err) => {
        console.error("Checkout initialization error:", err); // Debug log
        setError("Failed to initialize checkout");
      })
      .finally(() => setIntentLoading(false));
  }, [loading, cartItems.length, addressComplete, customerEmail, clientSecret, intentLoading, shouldCreateIntent]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="card text-center py-16">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-neutral-600 mb-8">
            Add some products to checkout
          </p>
          <Link href="/store" className="btn">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="card text-center py-16">
          <h2 className="text-2xl font-bold mb-4">Checkout Error</h2>
          <p className="text-neutral-600 mb-8">
            {error || "Unable to initialize checkout. Please try again."}
          </p>
          <Link href="/store/cart" className="btn">
            Back to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
          Checkout
        </h1>
        <p className="text-neutral-600">
          Complete your order securely below
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="space-y-6 mb-8">
              <div>
                <h3 className="font-bold text-lg uppercase tracking-wider mb-2">Email</h3>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    // Trigger intent creation if address is already complete
                    if (addressComplete && e.target.value.includes('@') && !clientSecret) {
                      setShouldCreateIntent(true);
                    }
                  }}
                  className="w-full border border-brand-accent px-3 py-3 rounded-none bg-[var(--storm-blue)] text-[var(--paper)] placeholder:text-[rgba(243,232,216,0.6)]"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg uppercase tracking-wider mb-2">
                  Shipping Address
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      required
                      value={shippingAddress.name}
                      onChange={(e) => updateAddress("name", e.target.value)}
                      className="w-full border border-brand-accent px-3 py-3 rounded-none bg-[var(--storm-blue)] text-[var(--paper)] placeholder:text-[rgba(243,232,216,0.6)]"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={shippingAddress.phone}
                      onChange={(e) => updateAddress("phone", e.target.value)}
                      className="w-full border border-brand-accent px-3 py-3 rounded-none bg-[var(--storm-blue)] text-[var(--paper)] placeholder:text-[rgba(243,232,216,0.6)]"
                      placeholder="Phone (optional)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      required
                      value={shippingAddress.line1}
                      onChange={(e) => updateAddress("line1", e.target.value)}
                      className="w-full border border-brand-accent px-3 py-3 rounded-none bg-[var(--storm-blue)] text-[var(--paper)] placeholder:text-[rgba(243,232,216,0.6)]"
                      placeholder="Address line 1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={shippingAddress.line2}
                      onChange={(e) => updateAddress("line2", e.target.value)}
                      className="w-full border border-brand-accent px-3 py-3 rounded-none bg-[var(--storm-blue)] text-[var(--paper)] placeholder:text-[rgba(243,232,216,0.6)]"
                      placeholder="Address line 2 (optional)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => updateAddress("city", e.target.value)}
                      className="w-full border border-brand-accent px-3 py-3 rounded-none bg-[var(--storm-blue)] text-[var(--paper)] placeholder:text-[rgba(243,232,216,0.6)]"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) => updateAddress("state", e.target.value)}
                      className="w-full border border-brand-accent px-3 py-3 rounded-none bg-[var(--storm-blue)] text-[var(--paper)] placeholder:text-[rgba(243,232,216,0.6)]"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={shippingAddress.postal_code}
                      onChange={(e) => updateAddress("postal_code", e.target.value)}
                      className="w-full border border-brand-accent px-3 py-3 rounded-none bg-[var(--storm-blue)] text-[var(--paper)] placeholder:text-[rgba(243,232,216,0.6)]"
                      placeholder="ZIP / Postal code"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={shippingAddress.country}
                      onChange={(e) => updateAddress("country", e.target.value)}
                      className="w-full border border-brand-accent px-3 py-3 rounded-none bg-[var(--storm-blue)] text-[var(--paper)] placeholder:text-[rgba(243,232,216,0.6)]"
                      placeholder="Country"
                    />
                  </div>
                </div>
                {!addressComplete && (
                  <p className="text-xs text-neutral-800 mt-2">
                    Please complete all required address fields to continue.
                  </p>
                )}
              </div>
            </div>

            {!clientSecret && (
              <div className="alert-info mb-6">
                <p className="text-sm">
                  Enter your email and complete the shipping address to load secure payment.
                </p>
              </div>
            )}

            {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  paymentMethodOrder: ["card"],
                  loader: "auto",
                  appearance: {
                    theme: "flat",
                    variables: {
                      colorPrimary: "#000000",
                      colorBackground: "#ffffff",
                      colorText: "#000000",
                      colorDanger: "#000000",
                      fontFamily: "Inter, system-ui, sans-serif",
                      spacingUnit: "4px",
                      borderRadius: "4px",
                      focusBoxShadow: "0 0 0 2px rgba(0, 0, 0, 0.2)",
                    },
                    rules: {
                      '.Input': {
                        border: '1px solid #cfcfcf',
                        boxShadow: 'none',
                        padding: '12px',
                      },
                      '.Input:focus': {
                        border: '1px solid #000000',
                        boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.1)',
                      },
                      '.Input--invalid': {
                        border: '1px solid #000000',
                      },
                      '.Label': {
                        fontWeight: '500',
                        marginBottom: '8px',
                      },
                    },
                  },
                }}
              >
              <CheckoutForm
                customerEmail={customerEmail}
                shippingAddress={shippingAddress}
                orderId={orderId}
              />
              </Elements>
            )}

            {intentLoading && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 mt-4">
                <div className="spinner border-2"></div>
                Calculating shipping and initializing payment...
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="font-bold text-xl uppercase tracking-wider mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 mb-6 pb-6 border-b border-brand-accent">
              {cartItems.map((item, index) => {
                // Build display name from available cart item data
                const displayName = item.productTitle || `Item ${index + 1}`;
                const sizeInfo = item.selectedSize ? `Size ${item.selectedSize}` : '';
                const colorInfo = item.selectedColor?.name ? item.selectedColor.name : '';
                
                let details = [];
                if (sizeInfo) details.push(sizeInfo);
                if (colorInfo) details.push(colorInfo);
                const detailsText = details.length > 0 ? ` (${details.join(', ')})` : '';
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{displayName}</span>
                      <span className="text-neutral-600">Qty: {item.qty}</span>
                    </div>
                    {detailsText && (
                      <div className="text-xs text-neutral-500">
                        {detailsText}
                      </div>
                    )}
                    {/* Show color swatch if available */}
                    {item.selectedColor?.hex && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 border border-neutral-300 rounded"
                          style={{ backgroundColor: item.selectedColor.hex }}
                        />
                        <span className="text-xs text-neutral-500">{item.selectedColor.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Discount Code Input */}
            <div className="mb-6 pb-6 border-b border-brand-accent">
              {!appliedDiscount ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Discount Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyDiscount()}
                      placeholder="Enter code"
                      className="flex-1 border border-brand-accent px-3 py-2 rounded-none bg-[var(--storm-blue)] text-[var(--paper)] placeholder:text-[rgba(243,232,216,0.6)] text-sm"
                      disabled={validatingDiscount || !customerEmail}
                    />
                    <button
                      onClick={handleApplyDiscount}
                      disabled={validatingDiscount || !customerEmail || !discountCode.trim()}
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      {validatingDiscount ? "..." : "Apply"}
                    </button>
                  </div>
                  {discountError && (
                    <p className="text-xs text-red-600">{discountError}</p>
                  )}
                  {!customerEmail && (
                    <p className="text-xs text-neutral-600">Enter your email first to apply a discount code</p>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Code Applied: {appliedDiscount.code}
                      </p>
                      <p className="text-xs text-green-600">
                        {appliedDiscount.type === 'percentage'
                          ? `${appliedDiscount.value}% off`
                          : `$${(appliedDiscount.value / 100).toFixed(2)} off`}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-brand-accent">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">
                  {orderTotals ? `$${orderTotals.subtotal.toFixed(2)}` : (
                    <span className="text-neutral-400">Calculating...</span>
                  )}
                </span>
              </div>
              {appliedDiscount && orderTotals && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span className="font-medium">
                    -{appliedDiscount.type === 'percentage'
                      ? `$${((orderTotals.subtotal * appliedDiscount.value) / 100).toFixed(2)}`
                      : `$${(appliedDiscount.value / 100).toFixed(2)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className="font-medium">
                  {orderTotals ? (
                    orderTotals.shipping > 0 ? `$${orderTotals.shipping.toFixed(2)}` : 'FREE'
                  ) : (
                    <span className="text-neutral-400">Calculating...</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span className="font-medium">
                  {orderTotals ? (
                    orderTotals.tax > 0 ? `$${orderTotals.tax.toFixed(2)}` : '$0.00'
                  ) : (
                    <span className="text-neutral-400">Calculating...</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Total</span>
              <span>
                {orderTotals ? `$${orderTotals.total.toFixed(2)}` : (
                  <span className="text-neutral-400">Calculating...</span>
                )}
              </span>
            </div>

            {/* Debug info - remove after testing */}
            {process.env.NODE_ENV === 'development' && orderTotals && (
              <div className="text-xs text-neutral-500 mb-4 p-2 bg-neutral-100 rounded">
                <strong>Debug Info:</strong>
                <br />Subtotal: ${orderTotals.subtotal.toFixed(2)}
                <br />Shipping: ${orderTotals.shipping.toFixed(2)}
                <br />Tax: ${orderTotals.tax.toFixed(2)}
                <br />Total: ${orderTotals.total.toFixed(2)}
              </div>
            )}

            <div className="bg-[var(--blood-red)] border border-brand-accent p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-xs">
                  <p className="font-bold mb-1">Production Time</p>
                  <p className="text-neutral-600">
                    Your order is made fresh to order. Please allow 7–10
                    business days for production before shipping.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
