import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-4">DOXA THREADS</h1>
          <p className="text-xl lg:text-2xl text-neutral-600">Clothing That Reflects God’s Glory.</p>
        </div>

        {/* What we stand for */}
        <section className="card">
          <h2 className="text-3xl font-bold mb-4">What We Stand For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 text-neutral-700">
              <p className="font-semibold">We stand for:</p>
              <ul className="space-y-2">
                <li>• Representing God without preaching</li>
                <li>• Walking with quiet confidence, not arrogance</li>
                <li>• Reflecting light in dark places</li>
                <li>• Faith that is lived, not staged</li>
                <li>• Clothing as a witness, not a flex</li>
              </ul>
            </div>
            <div className="text-neutral-700 leading-relaxed">
              <p>We believe what you wear should represent your purpose, not your pride. This is not fashion for ego. This is a uniform for people who carry light.</p>
            </div>
          </div>
        </section>

        {/* Our Message */}
        <section className="card bg-black text-white">
          <h2 className="text-3xl font-bold mb-4">Our Message</h2>
          <div className="space-y-4 text-neutral-100">
            <p>The message is simple: You are not the source of the glory — you are the reflection.</p>
            <p>DOXA Threads was created for people who want their lives to point beyond themselves. The design is subtle. The meaning is heavy. The presence is intentional.</p>
            <p className="text-neutral-300">No noise. No gimmicks. No performance. Just truth, worn daily.</p>
          </div>
        </section>

        {/* Pronunciation */}
        <section className="card text-center">
          <h2 className="text-3xl font-bold mb-4">How to Say It</h2>
          <p className="text-5xl font-black tracking-[0.2em] mb-2">DOXA</p>
          <p className="text-lg text-neutral-600 mb-2">pronounced: doks-uh</p>
          <p className="text-neutral-500">A four-letter word that carries a timeless weight. Glory. Honor. Presence.</p>
        </section>

        {/* More Than Clothing */}
        <section className="card">
          <h2 className="text-3xl font-bold mb-4">More Than Clothing</h2>
          <div className="space-y-4 text-neutral-700 leading-relaxed">
            <p>DOXA Threads is not a trend. It is not a phase. It is a statement of belonging and belief. Our designs are meant to be worn in real life — classrooms, streets, workplaces, and quiet moments.</p>
            <p>This brand isn’t about shouting faith. It’s about living it.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="card text-center">
          <h2 className="text-3xl font-bold mb-4">Wear the quiet statement</h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            DOXA Threads is for people who appreciate understatement. Black and white palettes, refined typography, and meaning baked in.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store" className="btn">
              Shop Collection
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
