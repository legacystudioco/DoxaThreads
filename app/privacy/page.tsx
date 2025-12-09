import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg">
          <p className="text-neutral-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, make a purchase, 
              or contact us for support. This may include your name, email address, shipping address, and payment information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Process and fulfill your orders</li>
              <li>Send you order confirmations and shipping updates</li>
              <li>Respond to your comments and questions</li>
              <li>Improve our website and services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties except as described in 
              this policy. We may share information with service providers who assist us in operating our website and 
              conducting our business.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Security</h2>
            <p>
              We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. 
              However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Cookies, Tracking & Advertising</h2>
            <p className="mb-4">
              We use cookies and similar tracking technologies — including Facebook Pixel — to collect information about your browsing behaviour, interactions, and purchases on this website. This data may include page views, product interactions, session duration, purchase events, and device/browser information.
            </p>
            <p className="mb-2 font-semibold">Purpose:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Analytics — to understand how visitors use our site and optimize performance.</li>
              <li>Advertising & Retargeting — to show relevant ads and ads based on past visits or actions.</li>
            </ul>
            <p className="mb-2 font-semibold">Third-Parties:</p>
            <p>
              Data collected may be shared with third-party partners, including Meta (Facebook), to enable these analytics and advertising services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@doxathreads.com
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link href="/" className="btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
