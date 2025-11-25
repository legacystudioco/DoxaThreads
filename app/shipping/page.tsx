import Link from "next/link";

export default function ShippingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Shipping Policy</h1>
        
        <div className="prose prose-lg">
          <p className="text-neutral-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Production Time</h2>
            <p>
              All products are made to order. Quality built to honor the craft. Production typically takes 7–10 business days before your order ships.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Shipping Methods</h2>
            <p>
              We offer several shipping options:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li><strong>Standard Shipping:</strong> 5-7 business days after production</li>
              <li><strong>Express Shipping:</strong> 2-3 business days after production</li>
              <li><strong>Priority Shipping:</strong> 1-2 business days after production</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Shipping Rates</h2>
            <p>
              Shipping costs are calculated at checkout based on your location and the weight of your order. 
              Rates are provided by our shipping partners and are displayed before you complete your purchase.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">International Shipping</h2>
            <p>
              We currently ship within the United States only. International shipping may be available in the future.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Order Tracking</h2>
            <p>
              Once your order ships, you&apos;ll receive a tracking number via email. You can use this number to track 
              your package&apos;s progress.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Returns & Exchanges</h2>
            <p>
              We offer a 30-day return policy with free size exchanges. Items must be unworn and in original condition. 
              Due to the made-to-order nature of our products, we cannot accept returns for buyer's remorse, but we will gladly exchange sizes or address any quality issues.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Contact</h2>
            <p>
              For shipping questions or concerns, please contact us at shipping@doxathreads.com
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
