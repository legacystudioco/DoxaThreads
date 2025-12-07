"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ConfirmNewsletterPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [discountCode, setDiscountCode] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid confirmation link. Please check your email.");
      return;
    }

    async function confirmSubscription() {
      try {
        const response = await fetch("/api/newsletter/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setDiscountCode(data.discountCode);
          setMessage("Your email has been confirmed!");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to confirm your subscription. Please try again.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    }

    confirmSubscription();
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/assets/Doxa_Logo.png"
              alt="DOXA"
              width={200}
              height={60}
              className="h-16 w-auto"
            />
          </div>

          {status === "loading" && (
            <div className="py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-[rgba(30,42,68,0.8)]">Confirming your subscription...</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 flex items-center justify-center mb-6 border-2 border-green-600 mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold mb-4 text-[var(--ink-black)]">
                {message}
              </h1>

              <p className="text-lg text-[rgba(30,42,68,0.8)] mb-6">
                Thank you for joining our newsletter!
              </p>

              <div className="bg-[var(--storm-blue)] text-[var(--paper)] p-6 mb-6">
                <p className="text-sm mb-2 opacity-90">Your Exclusive Discount Code:</p>
                <div className="text-3xl font-bold tracking-wider mb-2">
                  {discountCode}
                </div>
                <p className="text-sm opacity-90">20% off your first purchase</p>
              </div>

              <p className="text-sm text-[rgba(30,42,68,0.8)] mb-6">
                Use this code at checkout to get 20% off your first order. This code is valid for first-time customers only.
              </p>

              <Link href="/store" className="btn">
                Start Shopping
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="py-8">
              <div className="w-16 h-16 bg-red-100 text-red-600 flex items-center justify-center mb-6 border-2 border-red-600 mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold mb-4 text-[var(--ink-black)]">
                Confirmation Failed
              </h1>

              <p className="text-lg text-[rgba(30,42,68,0.8)] mb-6">
                {message}
              </p>

              <Link href="/" className="btn">
                Return Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
