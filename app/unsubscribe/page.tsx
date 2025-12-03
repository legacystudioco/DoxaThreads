"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if we came from a redirect (GET request already processed unsubscribe)
    const successParam = searchParams.get("success");
    const emailParam = searchParams.get("email");
    const errorParam = searchParams.get("error");

    if (successParam === "true") {
      setSuccess(true);
      setEmail(emailParam || "");
    } else if (errorParam) {
      switch (errorParam) {
        case "missing_token":
          setError("Missing unsubscribe token. Please use the link from your email.");
          break;
        case "invalid_token":
          setError("Invalid or expired unsubscribe link. Please contact support if you need assistance.");
          break;
        case "server_error":
          setError("An error occurred. Please try again later or contact support.");
          break;
        default:
          setError("An unexpected error occurred.");
      }
    }
  }, [searchParams]);

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="card">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-400"
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
              <h1 className="text-3xl font-serif mb-3">You're Unsubscribed</h1>
              {email && (
                <p className="text-gray-400 mb-4">
                  <span className="text-gray-300">{email}</span> has been removed from our mailing list.
                </p>
              )}
              <p className="text-gray-400">
                You will no longer receive marketing emails from Doxa Threads.
              </p>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-500 mb-4">
                Changed your mind? You can resubscribe anytime by signing up on our website.
              </p>
              <Link href="/" className="btn w-full">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="card">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
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
              <h1 className="text-3xl font-serif mb-3">Unsubscribe Failed</h1>
              <p className="text-gray-400">{error}</p>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-500 mb-4">
                Need help? Contact us at{" "}
                <a
                  href="mailto:info@doxa-threads.com"
                  className="text-accent hover:text-accent-dark"
                >
                  info@doxa-threads.com
                </a>
              </p>
              <Link href="/" className="btn-secondary w-full">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state (shouldn't normally be seen since GET redirects handle everything)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="card">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-serif mb-3">Processing...</h1>
            <p className="text-gray-400">Please wait while we process your request.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
