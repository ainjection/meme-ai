"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

interface GiphyResult {
  id: string;
  title: string;
  images: {
    fixed_height: { url: string; width: string; height: string };
    original: { url: string };
  };
}

export default function DashboardPage() {
  const [memes, setMemes] = useState<GiphyResult[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"trending" | "search">("trending");
  const router = useRouter();
  const supabase = createClient();

  async function fetchTrending() {
    setLoading(true);
    const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=g`);
    const data = await res.json();
    setMemes(data.data || []);
    setLoading(false);
  }

  async function fetchSearch(q: string) {
    if (!q.trim()) return fetchTrending();
    setLoading(true);
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=g`);
    const data = await res.json();
    setMemes(data.data || []);
    setLoading(false);
  }

  useEffect(() => { fetchTrending(); }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function selectMeme(meme: GiphyResult) {
    const url = encodeURIComponent(meme.images.original.url);
    const title = encodeURIComponent(meme.title);
    router.push(`/generate?meme=${url}&title=${title}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <Link href="/" className="text-xl font-bold">Meme<span className="text-purple-400">AI</span></Link>
        <div className="flex items-center gap-4">
          <Link href="/my-memes" className="text-gray-400 hover:text-white text-sm">My Memes</Link>
          <button onClick={signOut} className="text-gray-500 hover:text-white text-sm">Sign out</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Browse Memes</h1>

        <div className="flex gap-3 mb-6">
          <div className="flex gap-2">
            <button onClick={() => { setTab("trending"); fetchTrending(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "trending" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              🔥 Trending
            </button>
            <button onClick={() => setTab("search")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "search" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              Search
            </button>
          </div>
          {tab === "search" && (
            <form onSubmit={e => { e.preventDefault(); fetchSearch(search); }} className="flex gap-2 flex-1">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memes... e.g. Will Ferrell, celebration"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Search</button>
            </form>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl aspect-video animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {memes.map(meme => (
              <button key={meme.id} onClick={() => selectMeme(meme)}
                className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-colors">
                <img src={meme.images.fixed_height.url} alt={meme.title}
                  className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">Use this meme</span>
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-400 truncate">{meme.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
