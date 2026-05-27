"use client";
import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function WindowCard({ number, label, badge, children, bottomLabel, highlight }: {
  number: string; label: string; badge?: string; children: React.ReactNode;
  bottomLabel: string; highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col border-2 ${highlight ? "border-[#D42B2B]" : "border-[#1A1A1A]"} bg-[#F5F1E8]`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-sm">{number}</span>
          <span className="text-white font-bold text-xs tracking-widest uppercase">{label}</span>
          {badge && <span className="bg-[#1A1A1A] border border-gray-600 text-gray-400 text-[10px] font-bold px-1.5 py-0.5 tracking-wider">{badge}</span>}
        </div>
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 min-h-[280px] flex items-center justify-center">
        {children}
      </div>
      {/* Footer label */}
      <div className="px-3 py-2 border-t-2 border-[#1A1A1A] bg-[#1A1A1A]">
        <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase">{bottomLabel}</span>
      </div>
    </div>
  );
}

function GenerateForm() {
  const params = useSearchParams();
  const router = useRouter();
  const memeUrl = params.get("meme") ? decodeURIComponent(params.get("meme")!) : "";
  const memeStill = params.get("still") ? decodeURIComponent(params.get("still")!) : memeUrl;
  const memeTitle = params.get("title") ? decodeURIComponent(params.get("title")!) : "";
  const isVideo = memeUrl.includes(".gif") || memeUrl.includes("giphy");

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

    // Convert photo to base64 data URI — no storage service needed
    const photoUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(photo);
    });

    setStatus("generating");
    const genRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memeUrl, memeStill, userPhotoUrl: photoUrl, swapType, memeTitle }),
    });
    if (!genRes.ok) { const e = await genRes.json(); setError(e.error || "Generation failed"); setStatus("error"); return; }
    const { generationId } = await genRes.json();

    setStatus("polling");
    let attempts = 0;
    const poll = async () => {
      if (attempts++ > 60) { setError("Timed out."); setStatus("error"); return; }
      const pollRes = await fetch(`/api/poll/${generationId}`);
      const result = await pollRes.json();
      if (result.status === "completed") { setOutputUrl(result.outputUrl); setStatus("done"); }
      else if (result.status === "failed") { setError(result.error || "Generation failed."); setStatus("error"); }
      else setTimeout(poll, 3000);
    };
    poll();
  }

  const isLoading = ["uploading", "generating", "polling"].includes(status);

  const statusText = () => {
    if (status === "idle") return photo && memeUrl ? "Ready to generate." : "Select a meme and upload your photo.";
    if (status === "uploading") return "Uploading photo...";
    if (status === "generating") return "Starting AI model...";
    if (status === "polling") return "Generating... (~30–60s)";
    if (status === "done") return "Done. Try another?";
    if (status === "error") return `Error: ${error}`;
    return "";
  };

  return (
    <div className="min-h-screen bg-[#EEEAE2]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b-2 border-[#1A1A1A] bg-[#EEEAE2]">
        <Link href="/dashboard" className="font-black text-xl tracking-tight">MEME<span className="text-[#D42B2B]">AI</span></Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs font-bold tracking-widest uppercase text-[#7A7060] hover:text-[#1A1A1A]">← Browse</Link>
          <Link href="/my-memes" className="text-xs font-bold tracking-widest uppercase text-[#7A7060] hover:text-[#1A1A1A]">My Memes</Link>
        </div>
      </nav>

      <div className="p-6 max-w-6xl mx-auto">
        {/* 3-panel grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Panel 1: Meme */}
          <WindowCard number="1" label="MEME" badge={isVideo ? "GIF" : "IMG"}
            bottomLabel={memeUrl ? "ANIMATED" : "NO MEME SELECTED"}>
            {memeUrl ? (
              <div className="w-full h-full relative group cursor-pointer" onClick={() => router.push("/dashboard")}>
                <img src={memeUrl} alt="Selected meme" className="w-full h-64 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white font-bold text-xs tracking-widest uppercase">CHANGE MEME</span>
                </div>
              </div>
            ) : (
              <Link href="/dashboard" className="flex flex-col items-center gap-2 text-[#7A7060] hover:text-[#1A1A1A]">
                <span className="text-4xl">🎬</span>
                <span className="text-xs font-bold tracking-widest uppercase">Pick a meme</span>
              </Link>
            )}
          </WindowCard>

          {/* Panel 2: Your Photo */}
          <WindowCard number="2" label="YOUR PHOTO"
            bottomLabel={photo ? "PHOTO LOADED" : "UPLOAD A CLEAR SELFIE"}>
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-full flex items-center justify-center group cursor-pointer">
              {photoPreview ? (
                <div className="relative w-full">
                  <img src={photoPreview} alt="Your photo" className="w-full h-64 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-bold text-xs tracking-widest uppercase">CHANGE PHOTO</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#7A7060] group-hover:text-[#1A1A1A]">
                  <span className="text-4xl">📸</span>
                  <span className="text-xs font-bold tracking-widest uppercase">Upload photo</span>
                  <span className="text-[10px] text-[#7A7060]">JPG or PNG, clear face</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </WindowCard>

          {/* Panel 3: Result */}
          <WindowCard number="3" label="RESULT" badge={status === "done" ? "READY" : undefined}
            bottomLabel={status === "done" ? "VIDEO READY" : status === "polling" ? "PROCESSING..." : "RESULT APPEARS HERE"}
            highlight={status === "done"}>
            {status === "done" && outputUrl ? (
              outputUrl.includes(".mp4") || outputUrl.includes("video") ? (
                <video src={outputUrl} autoPlay loop muted className="w-full h-64 object-cover" />
              ) : (
                <img src={outputUrl} alt="Result" className="w-full h-64 object-cover" />
              )
            ) : isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#1A1A1A] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold tracking-widest uppercase text-[#7A7060]">
                  {status === "uploading" ? "UPLOADING" : status === "generating" ? "STARTING" : "GENERATING"}
                </span>
              </div>
            ) : (
              <div className="text-[#7A7060] text-xs font-bold tracking-widest uppercase">AWAITING GENERATION</div>
            )}
          </WindowCard>
        </div>

        {/* Swap type selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black tracking-[0.3em] uppercase">SWAP TYPE</span>
            <span className="text-xs font-bold tracking-widest uppercase text-[#7A7060]">PICK ONE</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Face Only */}
            <button onClick={() => setSwapType("face")}
              className={`text-left p-5 border-2 transition-colors ${swapType === "face" ? "border-[#1A1A1A] bg-[#F5F1E8]" : "border-[#C5C0B8] bg-[#EEEAE2] hover:border-[#1A1A1A]"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 border-2 ${swapType === "face" ? "bg-[#1A1A1A] border-[#1A1A1A]" : "bg-transparent border-[#7A7060]"}`}></span>
                <span className="font-black text-xl uppercase tracking-tight">FACE ONLY</span>
              </div>
              <p className="text-sm text-[#7A7060] italic mb-3">Swaps just the face. Body and clothes stay the same.</p>
              <div className="flex gap-3 text-[10px] font-bold tracking-widest uppercase text-[#7A7060]">
                <span>~60–120S</span><span>·</span><span>STANDARD</span><span>·</span><span>FRAME BY FRAME</span>
              </div>
            </button>

            {/* Full Body */}
            <button onClick={() => setSwapType("body")}
              className={`text-left p-5 border-2 relative transition-colors ${swapType === "body" ? "border-[#D42B2B] bg-[#F5F1E8]" : "border-[#C5C0B8] bg-[#EEEAE2] hover:border-[#D42B2B]"}`}>
              <div className="absolute top-3 right-3 bg-[#D4F233] text-[#1A1A1A] text-[10px] font-black px-2 py-0.5 tracking-widest uppercase">PREMIUM</div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 border-2 ${swapType === "body" ? "bg-[#D42B2B] border-[#D42B2B]" : "bg-transparent border-[#7A7060]"}`}></span>
                <span className="font-black text-xl uppercase tracking-tight">FULL BODY</span>
              </div>
              <p className="text-sm text-[#7A7060] italic mb-3">Replaces the whole character. You become the meme.</p>
              <div className="flex gap-3 text-[10px] font-bold tracking-widest uppercase text-[#7A7060]">
                <span>~2–4 MIN</span><span>·</span><span>PREMIUM</span><span>·</span><span>WAN-VIDEO 2.1</span>
              </div>
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-2 border-[#1A1A1A] bg-[#F5F1E8] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#D42B2B]">STATUS</span>
            <span className="text-sm font-bold italic">{statusText()}</span>
          </div>
          <div className="flex gap-3">
            {status === "done" && outputUrl && (
              <a href={outputUrl} download
                className="border-2 border-[#1A1A1A] px-5 py-2 text-xs font-black tracking-widest uppercase hover:bg-[#1A1A1A] hover:text-white transition-colors">
                OPEN FULL SIZE ↗
              </a>
            )}
            <button onClick={status === "done" ? () => { setStatus("idle"); setOutputUrl(""); } : handleGenerate}
              disabled={isLoading || (!photo && status !== "done") || (!memeUrl && status !== "done")}
              className="bg-[#1A1A1A] disabled:opacity-40 text-white px-6 py-2 text-xs font-black tracking-widest uppercase hover:bg-[#D42B2B] disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              {isLoading ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>WORKING</>
              ) : status === "done" ? "GENERATE AGAIN →" : "GENERATE →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return <Suspense><GenerateForm /></Suspense>;
}
