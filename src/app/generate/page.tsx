"use client";
import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function GenerateForm() {
  const params = useSearchParams();
  const router = useRouter();
  const memeUrl = params.get("meme") ? decodeURIComponent(params.get("meme")!) : "";
  const memeTitle = params.get("title") ? decodeURIComponent(params.get("title")!) : "Selected meme";

  const [swapType, setSwapType] = useState<"face" | "body">("face");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "uploading" | "generating" | "polling" | "done" | "error">("idle");
  const [outputUrl, setOutputUrl] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleGenerate() {
    if (!photo || !memeUrl) return;
    setStatus("uploading");
    setError("");

    // Upload photo
    const form = new FormData();
    form.append("file", photo);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
    if (!uploadRes.ok) { setError("Photo upload failed"); setStatus("error"); return; }
    const { url: photoUrl } = await uploadRes.json();

    // Start generation
    setStatus("generating");
    const genRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memeUrl, userPhotoUrl: photoUrl, swapType, memeTitle }),
    });
    if (!genRes.ok) { const e = await genRes.json(); setError(e.error || "Generation failed"); setStatus("error"); return; }
    const { generationId } = await genRes.json();

    // Poll for result
    setStatus("polling");
    let attempts = 0;
    const poll = async () => {
      if (attempts++ > 60) { setError("Timed out. Please try again."); setStatus("error"); return; }
      const pollRes = await fetch(`/api/poll/${generationId}`);
      const result = await pollRes.json();
      if (result.status === "completed") { setOutputUrl(result.outputUrl); setStatus("done"); }
      else if (result.status === "failed") { setError("Generation failed. Please try again."); setStatus("error"); }
      else setTimeout(poll, 3000);
    };
    poll();
  }

  const isLoading = ["uploading", "generating", "polling"].includes(status);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <Link href="/dashboard" className="text-xl font-bold">Meme<span className="text-purple-400">AI</span></Link>
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Back to memes</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-8">Create your meme</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: meme preview + options */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Selected meme</h2>
              {memeUrl ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <img src={memeUrl} alt={memeTitle} className="w-full" />
                  <p className="text-xs text-gray-500 p-3 truncate">{memeTitle}</p>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                  <p className="text-gray-500 text-sm">No meme selected.</p>
                  <Link href="/dashboard" className="text-purple-400 text-sm">← Pick one</Link>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Swap type</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["face", "body"] as const).map(type => (
                  <button key={type} onClick={() => setSwapType(type)}
                    className={`p-4 rounded-xl border text-left transition-colors ${swapType === type ? "border-purple-500 bg-purple-900/20" : "border-gray-700 bg-gray-900 hover:border-gray-600"}`}>
                    <div className="font-semibold capitalize mb-1">{type} swap</div>
                    <div className="text-xs text-gray-400">{type === "face" ? "Keeps hair & outfit, swaps only the face" : "Replaces the entire person with you"}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: upload + generate */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Your photo</h2>
              <button onClick={() => fileRef.current?.click()}
                className="w-full bg-gray-900 border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-xl p-8 text-center transition-colors">
                {photoPreview ? (
                  <img src={photoPreview} alt="Your photo" className="w-32 h-32 object-cover rounded-full mx-auto" />
                ) : (
                  <>
                    <div className="text-4xl mb-3">📸</div>
                    <p className="text-gray-400 text-sm">Click to upload your photo</p>
                    <p className="text-gray-600 text-xs mt-1">JPG, PNG up to 10MB</p>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              {photoPreview && (
                <button onClick={() => fileRef.current?.click()} className="text-purple-400 text-xs mt-2">Change photo</button>
              )}
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            {status === "done" && outputUrl ? (
              <div className="space-y-4">
                <div className="bg-gray-900 border border-green-700/50 rounded-xl overflow-hidden">
                  {outputUrl.endsWith(".mp4") || outputUrl.includes("video") ? (
                    <video src={outputUrl} controls className="w-full rounded-xl" />
                  ) : (
                    <img src={outputUrl} alt="Your meme" className="w-full rounded-xl" />
                  )}
                </div>
                <div className="flex gap-3">
                  <a href={outputUrl} download className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl text-center transition-colors text-sm">
                    ↓ Download
                  </a>
                  <Link href="/my-memes" className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold py-3 rounded-xl text-center transition-colors text-sm">
                    View all memes
                  </Link>
                </div>
                <button onClick={() => { setStatus("idle"); setOutputUrl(""); }}
                  className="w-full text-purple-400 text-sm hover:text-purple-300">Create another</button>
              </div>
            ) : (
              <button onClick={handleGenerate} disabled={!photo || !memeUrl || isLoading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-lg transition-colors">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {status === "uploading" ? "Uploading photo..." : status === "generating" ? "Starting AI..." : "Generating (~30s)..."}
                  </span>
                ) : "Generate meme →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense>
      <GenerateForm />
    </Suspense>
  );
}
