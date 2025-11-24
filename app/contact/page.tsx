import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
        <p className="text-lg text-neutral-600 mb-12">
          Questions, partnerships, or styling a shoot—reach out and we&apos;ll keep it straightforward.
        </p>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card">
            <div className="w-12 h-12 bg-black flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Email Us</h3>
            <p className="text-neutral-600 mb-4">
              For general inquiries and customer support
            </p>
            <a 
              href="mailto:hello@doxathreads.com" 
              className="text-sm font-bold hover:underline"
            >
              hello@doxathreads.com
            </a>
          </div>

          <div className="card">
            <div className="w-12 h-12 bg-black flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Order Support</h3>
            <p className="text-neutral-600 mb-4">
              Questions about your order or shipping
            </p>
            <a 
              href="mailto:orders@doxathreads.com" 
              className="text-sm font-bold hover:underline"
            >
              orders@doxathreads.com
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          
          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              What is your production time?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                All pieces are made to order with a production time of 7–10 business days. Shipping timing depends on your location and method.
              </p>
            </div>
          </details>

          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              Do you offer international shipping?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                We currently ship within the United States only. International options are on the roadmap.
              </p>
            </div>
          </details>

          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              What is your return policy?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                We offer a 30-day return policy with free size exchanges. Items must be unworn and in original condition. Because everything is made to order, we handle fit exchanges and any quality issues first.
              </p>
            </div>
          </details>

          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              How do I track my order?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                Once your order ships, you&apos;ll receive a tracking number via email. Use it to follow the package in real time.
              </p>
            </div>
          </details>

          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              Are you hiring or looking for collaborations?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                We&apos;re open to thoughtful collaborations and wholesale conversations. Reach us at <a href="mailto:hello@doxathreads.com" className="underline">hello@doxathreads.com</a>.
              </p>
            </div>
          </details>

          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              Where does my purchase go?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                DOXA means glory, so stewardship matters. We keep operations lean, source premium blanks, and invest back into the craft.
              </p>
            </div>
          </details>
        </div>

        {/* Call to Action */}
        <div className="card text-center bg-black text-white">
          <h3 className="text-2xl font-bold mb-3">Still Have Questions?</h3>
          <p className="mb-6">
            If you need a real person, email us. We respond quickly and keep it direct.
          </p>
          <a 
            href="mailto:hello@doxathreads.com" 
            className="btn bg-white text-black border-white hover:bg-transparent hover:text-white"
          >
            Email Us
          </a>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href="/" className="text-sm hover:underline text-neutral-600">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
