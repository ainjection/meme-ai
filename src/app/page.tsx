import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <span className="text-xl font-bold tracking-tight">
          Meme<span className="text-purple-400">AI</span>
        </span>
        <div className="flex gap-4">
          <Link href="/sign-in" className="text-gray-400 hover:text-white text-sm px-4 py-2">Sign in</Link>
          <Link href="/sign-up" className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-900/40 border border-purple-700/50 text-purple-300 text-sm px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse inline-block"></span>
          Hack culture. Go viral.
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          Put yourself in any<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            trending meme
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Find viral memes, swap in your face or full body, and share content that actually gets attention.
          Under 60 seconds per swap.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            Start for free →
          </Link>
          <Link href="/dashboard" className="border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            Browse memes
          </Link>
        </div>
        <p className="text-gray-500 text-sm mt-6">No credit card required · 10 free swaps to start</p>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Pick a meme", desc: "Browse thousands of trending GIFs and memes. Search by keyword or scroll the live trending feed." },
            { step: "2", title: "Upload your photo", desc: "Upload any photo of yourself, an influencer, or your product. Choose face swap or full body swap." },
            { step: "3", title: "Go viral", desc: "Download in seconds. Post everywhere. Piggyback on existing virality to grow your brand." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">{step}</div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-gray-400 text-center mb-12">Each swap costs pennies. We keep the margin, you keep the memes.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Free</div>
            <div className="text-4xl font-bold mb-1">$0</div>
            <div className="text-gray-500 text-sm mb-6">forever</div>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-2"><span className="text-green-400">✓</span> 10 swaps / month</li>
              <li className="flex gap-2"><span className="text-green-400">✓</span> Face swap & body swap</li>
              <li className="flex gap-2"><span className="text-green-400">✓</span> Trending meme library</li>
            </ul>
          </div>
          <div className="bg-purple-900/30 border border-purple-600/50 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
            <div className="text-purple-300 text-sm font-medium uppercase tracking-wider mb-2">Pro</div>
            <div className="text-4xl font-bold mb-1">$15</div>
            <div className="text-gray-500 text-sm mb-6">per month</div>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-2"><span className="text-green-400">✓</span> 100 swaps / month</li>
              <li className="flex gap-2"><span className="text-green-400">✓</span> Face swap & body swap</li>
              <li className="flex gap-2"><span className="text-green-400">✓</span> HD output + cloud storage</li>
              <li className="flex gap-2"><span className="text-green-400">✓</span> Priority generation</li>
            </ul>
            <Link href="/sign-up" className="block mt-6 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl text-center transition-colors">
              Get Pro →
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center text-gray-600 text-sm py-8 border-t border-gray-900">
        © 2026 MemeAI
      </footer>
    </div>
  );
}
