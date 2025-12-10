"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Check if user has already seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem("newsletter-popup-seen");

    if (!hasSeenPopup) {
      // Show popup after 6 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Mark as seen for this session
    sessionStorage.setItem("newsletter-popup-seen", "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage({ type: "error", text: "Please enter your email address" });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Check your email to confirm your subscription and get your discount code!"
        });
        setEmail("");
        // Auto-close after showing success message
        setTimeout(() => {
          handleClose();
        }, 4000);
      } else {
        setMessage({ type: "error", text: data.error || "Something went wrong. Please try again." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to subscribe. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--paper)] border-2 border-[var(--mustard-gold)] shadow-2xl max-w-md w-full p-8 relative pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-[rgba(30,42,68,0.6)] hover:text-[var(--ink-black)] transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-6 -mt-4">
            <Image
              src="/assets/Doxa_popup.png"
              alt="DOXA"
              width={400}
              height={200}
              className="w-full h-auto"
              priority
            />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-center mb-2 text-[var(--ink-black)]">
            Welcome to DOXA
          </h2>
          <p className="text-center text-[rgba(30,42,68,0.8)] mb-6">
            Join our newsletter and get <span className="font-bold text-[var(--blood-red)]">20% off</span> your first purchase!
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-[rgba(30,42,68,0.2)] focus:border-[var(--mustard-gold)] focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            {message && (
              <div
                className={`p-3 text-sm text-center ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Subscribing..." : "Get My 20% Off"}
            </button>
          </form>

          {/* Fine print */}
          <p className="text-xs text-center text-[rgba(30,42,68,0.6)] mt-4">
            By subscribing, you agree to receive marketing emails from DOXA Threads. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </>
  );
}
