"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Generation {
  id: string;
  meme_title: string;
  output_url: string;
  swap_type: string;
  status: string;
  created_at: string;
}

export default function MyMemesPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("generations")
        .select("*")
        .order("created_at", { ascending: false });
      setGenerations(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <Link href="/" className="text-xl font-bold">Meme<span className="text-purple-400">AI</span></Link>
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">Browse memes →</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">My Memes</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl aspect-video animate-pulse" />
            ))}
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🎭</div>
            <p className="text-gray-400 mb-4">No memes yet</p>
            <Link href="/dashboard" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
              Create your first meme →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generations.map(gen => (
              <div key={gen.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {gen.status === "completed" && gen.output_url ? (
                  gen.output_url.includes(".mp4") ? (
                    <video src={gen.output_url} className="w-full h-40 object-cover" muted loop autoPlay />
                  ) : (
                    <img src={gen.output_url} alt={gen.meme_title} className="w-full h-40 object-cover" />
                  )
                ) : (
                  <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
                    {gen.status === "processing" ? (
                      <svg className="animate-spin w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <span className="text-gray-500 text-sm">Failed</span>
                    )}
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs text-gray-400 truncate">{gen.meme_title || "Meme"}</p>
                  <p className="text-xs text-gray-600 mt-1">{gen.swap_type} swap · {new Date(gen.created_at).toLocaleDateString()}</p>
                  {gen.status === "completed" && gen.output_url && (
                    <a href={gen.output_url} download className="block mt-2 text-center text-xs bg-gray-800 hover:bg-gray-700 text-white py-1.5 rounded-lg transition-colors">
                      ↓ Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
