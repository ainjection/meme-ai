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
    original_still: { url: string };
  };
}

export default function DashboardPage() {
  const [memes, setMemes] = useState<GiphyResult[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"trending" | "search">("trending");
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleUpgrade() {
    setUpgrading(true);
    const res = await fetch("/api/checkout", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setUpgrading(false);
  }

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
    const still = encodeURIComponent(meme.images.original_still?.url || meme.images.fixed_height.url);
    const title = encodeURIComponent(meme.title);
    router.push(`/generate?meme=${url}&still=${still}&title=${title}`);
  }

  return (
    <div className="min-h-screen bg-[#EEEAE2]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b-2 border-[#1A1A1A] bg-[#EEEAE2]">
        <Link href="/" className="font-black text-xl tracking-tight">MEME<span className="text-[#D42B2B]">AI</span></Link>
        <div className="flex items-center gap-4">
          <Link href="/my-memes" className="text-xs font-bold tracking-widest uppercase text-[#7A7060] hover:text-[#1A1A1A]">My Memes</Link>
          <button onClick={handleUpgrade} disabled={upgrading}
            className="border-2 border-[#D42B2B] text-[#D42B2B] px-4 py-1.5 text-[10px] font-black tracking-widest uppercase hover:bg-[#D42B2B] hover:text-white transition-colors disabled:opacity-50">
            {upgrading ? "LOADING..." : "UPGRADE TO PRO"}
          </button>
          <button onClick={signOut}
            className="text-[10px] font-bold tracking-widest uppercase text-[#7A7060] hover:text-[#1A1A1A]">
            SIGN OUT
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-black text-2xl tracking-tight uppercase">MEME LIBRARY</h1>
            <p className="text-xs font-bold tracking-widest text-[#7A7060] uppercase mt-0.5">Pick a meme to get started</p>
          </div>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#7A7060]">
            POWERED BY GIPHY
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex gap-3 mb-6 items-center">
          <button onClick={() => { setTab("trending"); fetchTrending(); }}
            className={`px-4 py-2 text-[10px] font-black tracking-widest uppercase border-2 transition-colors ${tab === "trending" ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-transparent text-[#7A7060] border-[#C5C0B8] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"}`}>
            TRENDING
          </button>
          <button onClick={() => setTab("search")}
            className={`px-4 py-2 text-[10px] font-black tracking-widest uppercase border-2 transition-colors ${tab === "search" ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-transparent text-[#7A7060] border-[#C5C0B8] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"}`}>
            SEARCH
          </button>
          {tab === "search" && (
            <form onSubmit={e => { e.preventDefault(); fetchSearch(search); }} className="flex gap-2 flex-1">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search memes... e.g. celebration, Will Ferrell"
                className="flex-1 bg-[#F5F1E8] border-2 border-[#1A1A1A] px-4 py-2 text-sm font-bold text-[#1A1A1A] placeholder-[#7A7060] focus:outline-none" />
              <button type="submit"
                className="bg-[#1A1A1A] text-white px-5 py-2 text-[10px] font-black tracking-widest uppercase hover:bg-[#D42B2B] transition-colors">
                GO →
              </button>
            </form>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="border-2 border-[#C5C0B8] bg-[#F5F1E8] aspect-video animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {memes.map(meme => (
              <button key={meme.id} onClick={() => selectMeme(meme)}
                className="group relative border-2 border-[#1A1A1A] bg-[#F5F1E8] overflow-hidden hover:border-[#D42B2B] transition-colors text-left">
                <img src={meme.images.fixed_height.url} alt={meme.title}
                  className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-[#D42B2B] text-white text-[10px] font-black px-4 py-2 tracking-widest uppercase">USE THIS →</span>
                </div>
                <div className="px-2 py-1.5 border-t-2 border-[#1A1A1A] bg-[#1A1A1A]">
                  <p className="text-[10px] font-bold text-white tracking-wider truncate uppercase">{meme.title || "UNTITLED"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
