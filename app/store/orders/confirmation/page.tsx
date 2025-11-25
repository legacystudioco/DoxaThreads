"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<any | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const paymentIntent = searchParams?.get("payment_intent");
    const orderId = searchParams?.get("order_id");
    
    if (paymentIntent) {
      // Clear cart
      localStorage.removeItem("cart");
      if (orderId) {
        fetch(`/api/orders/${orderId}`)
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data?.order) {
              setOrder(data);
            }
            setStatus("success");
          })
          .catch(() => setStatus("success"));
      } else {
        setStatus("success");
      }
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Confirming your order...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-black mx-auto mb-6 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">Order Failed</h2>
            <p className="text-neutral-600 mb-8">
              There was an issue processing your order. Please try again or contact support if the problem persists.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/store/cart" className="btn">
                Back to Cart
              </Link>
              <Link href="/store" className="btn-secondary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-16">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-black mx-auto mb-6 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold mb-4">Order Confirmed!</h1>
          
          <p className="text-lg text-neutral-600 mb-8">
            Thank you for your order! We&apos;ve received your payment and will begin crafting your pieces with care.
          </p>

          {order?.order && (
            <div className="card text-left mb-8">
              <h3 className="font-bold uppercase tracking-wider mb-4">Order Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Order ID</span>
                  <span className="font-mono">{order.order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Status</span>
                  <span className="font-medium">{order.order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total</span>
                  <span className="font-medium">${(order.order.total_cents / 100).toFixed(2)}</span>
                </div>
                {order.items && order.items.length > 0 && (
                  <div className="pt-4 border-t border-brand-accent">
                    <h4 className="font-bold mb-2">Items</h4>
                    <ul className="space-y-2">
                      {order.items.map((item: any) => (
                        <li key={item.id} className="flex justify-between text-sm">
                          <span>{item.product_title} {item.size ? `(${item.size})` : ""}</span>
                          <span className="text-neutral-600">Qty: {item.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {order.order.tracking_number && (
                  <div className="pt-4 border-t border-brand-accent">
                    <h4 className="font-bold mb-2">Tracking</h4>
                    <a
                      className="btn-secondary inline-flex"
                      href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.order.tracking_number}`}
                      target="_blank"
                    >
                      Track package
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Details */}
          <div className="card text-left mb-8">
            <h3 className="font-bold uppercase tracking-wider mb-4">What Happens Next?</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-black flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium mb-1">Order Confirmation</p>
                  <p className="text-sm text-neutral-600">
                    You&apos;ll receive an email confirmation with your order details.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-black flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium mb-1">Production (7–10 business days)</p>
                  <p className="text-sm text-neutral-600">
                    Your items will be made fresh to order using premium blanks and professional printing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-black flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium mb-1">Shipping Notification</p>
                  <p className="text-sm text-neutral-600">
                    Once shipped, you&apos;ll receive tracking information via email.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-black flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium mb-1">Delivery</p>
                  <p className="text-sm text-neutral-600">
                    Your order arrives at your doorstep. Enjoy!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/store" className="btn">
              Continue Shopping
            </Link>
            <Link href="/" className="btn-secondary">
              Back to Home
            </Link>
          </div>

          <p className="text-xs text-neutral-600 mt-8">
            Questions? Contact us at orders@doxathreads.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center">
          <div className="spinner mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
