import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/assets/Doxa_Logo.png"
              alt="DOXA Threads Logo"
              width={500}
              height={150}
              priority
              className="h-32 lg:h-44 w-auto"
            />
          </div>
          <p className="text-xl lg:text-2xl text-neutral-600">Greek for Glory. Worn with honor. Backed by faith.</p>
        </div>

        {/* What we stand for */}
        <section className="card">
          <h2 className="text-3xl font-bold mb-4">What We Stand For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="font-semibold">Built on:</p>
              <ul className="space-y-2">
                <li>• Faith and conviction</li>
                <li>• Traditional craftsmanship</li>
                <li>• Timeless design</li>
                <li>• Quality that honors the craft</li>
                <li>• Meaning over trends</li>
              </ul>
            </div>
            <div className="leading-relaxed">
              <p>American Traditional tattoo art meets sacred symbolism. Streetwear built with purpose and conviction, designed to last.</p>
            </div>
          </div>
        </section>

        {/* Our Message */}
        <section className="card">
          <h2 className="text-3xl font-bold mb-4">The Message</h2>
          <div className="space-y-4">
            <p>DOXA means glory — the visible presence of God. This isn't about self-glory. It's about wearing faith with honor.</p>
            <p>We merge American Traditional tattoo art with sacred symbolism. Bold imagery rooted in tradition and craftsmanship. Premium materials built to last.</p>
            <p>Designed to honor the craft. Made to mean something.</p>
          </div>
        </section>

        {/* Pronunciation */}
        <section className="card text-center">
          <h2 className="text-3xl font-bold mb-4">How to Say It</h2>
          <p className="text-5xl font-black tracking-[0.2em] mb-2">DOXA</p>
          <p className="text-lg mb-2">pronounced: doks-uh</p>
          <p>δόξα. Greek for glory. The visible presence of God.</p>
        </section>

        {/* More Than Clothing */}
        <section className="card">
          <h2 className="text-3xl font-bold mb-4">Built to Last</h2>
          <div className="space-y-4 leading-relaxed">
            <p>DOXA Threads merges traditional tattoo aesthetics with modern streetwear. Bold dove and rose imagery. Sacred symbolism that honors faith and heritage.</p>
            <p>Heavyweight blanks. Professional printing. Quality built to honor the craft.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="card text-center">
          <h2 className="text-3xl font-bold mb-4">Wear It With Purpose</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            American Traditional art meets sacred symbolism. Premium streetwear backed by faith.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store" className="btn">
              Shop the Collection
            </Link>
            <Link href="/contact" className="btn-secondary">
              Get in Touch
            </Link>
          </div>
        </section>

        <div className="text-center">
          <Link href="/" className="text-sm hover:underline text-neutral-600">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
