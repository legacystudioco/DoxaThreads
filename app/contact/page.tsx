import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
        <p className="text-lg text-neutral-600 mb-12">
          Questions about orders or the brand? Reach out.
        </p>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="card">
            <div className="w-12 h-12 bg-black flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">General Inquiries</h3>
            <p className="text-neutral-600 mb-4">
              For questions and support
            </p>
            <a
              href="mailto:info@doxa-threads.com"
              className="text-sm font-bold hover:underline"
            >
              info@doxa-threads.com
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
              Questions about orders or shipping
            </p>
            <a
              href="mailto:info@doxa-threads.com"
              className="text-sm font-bold hover:underline"
            >
              info@doxa-threads.com
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Common Questions</h2>
          
          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              Production time?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                All pieces are made to order. 7–10 business days, plus shipping time based on your location.
              </p>
            </div>
          </details>

          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              International shipping?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                US only for now. International options coming soon.
              </p>
            </div>
          </details>

          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              Return policy?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                14-day size exchange only. Items must be unworn, unwashed, and in original condition with tags attached.
              </p>
            </div>
          </details>

          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              Track my order?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                You'll receive tracking via email once your order ships.
              </p>
            </div>
          </details>

          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              Collaborations?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                Open to wholesale and partnerships. Email <a href="mailto:info@doxa-threads.com" className="underline">info@doxa-threads.com</a>.
              </p>
            </div>
          </details>

          <details className="border border-brand-accent mb-4">
            <summary className="cursor-pointer font-bold uppercase text-sm tracking-wider py-3 px-4 hover:bg-neutral-50 transition-colors">
              Where does my money go?
            </summary>
            <div className="p-4 border-t border-brand-accent text-sm text-neutral-600">
              <p>
                Premium materials and quality craftsmanship. Built to honor the work.
              </p>
            </div>
          </details>
        </div>

        {/* Call to Action */}
        <div className="card text-center bg-black text-white">
          <h3 className="text-2xl font-bold mb-3">Need More Info?</h3>
          <p className="mb-6">
            Email us. We keep it direct.
          </p>
          <a
            href="mailto:info@doxa-threads.com"
            className="btn"
          >
            Send Email
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
