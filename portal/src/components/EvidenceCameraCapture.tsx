"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RedactionType = "auto" | "manual" | "none";

interface EvidenceCameraCaptureProps {
  onDone: (blob: Blob, redactionType: RedactionType) => void;
  onCancel: () => void;
  /** Direct upload config — bypasses callback chain issues */
  uploadConfig?: {
    jobId: string;
    completionId: string;
    checklistRunId?: string;
    itemId?: string;
  };
  onUploadComplete?: () => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function EvidenceCameraCapture({ onDone, onCancel, uploadConfig, onUploadComplete }: EvidenceCameraCaptureProps) {
  const [step, setStep] = useState<"camera" | "processing" | "review" | "error">("camera");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [processingMsg, setProcessingMsg] = useState("Processing...");

  // Store captured frame as data URL (simpler, works everywhere)
  const capturedDataUrl = useRef<string | null>(null);
  const capturedW = useRef(0);
  const capturedH = useRef(0);

  const [detectedRects, setDetectedRects] = useState<Rect[]>([]);
  const [manualRects, setManualRects] = useState<Rect[]>([]);
  const [drawing, setDrawing] = useState<Rect | null>(null);
  const [showManualTools, setShowManualTools] = useState(false);
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Camera ---
  function startCamera(facing: "environment" | "user") {
    setVideoReady(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((s) => {
        setStream(s);
        const v = videoRef.current;
        if (v) {
          v.srcObject = s;
          const check = () => { if (v.videoWidth > 0) setVideoReady(true); };
          v.addEventListener("loadeddata", check, { once: true });
          v.addEventListener("canplay", check, { once: true });
          const poll = setInterval(() => { if (v.videoWidth > 0) { setVideoReady(true); clearInterval(poll); } }, 200);
          setTimeout(() => clearInterval(poll), 8000);
        }
      })
      .catch(() => {
        setError("Camera access denied. Please allow camera access in your browser settings.");
        setStep("error");
      });
  }

  useEffect(() => {
    startCamera(facingMode);
    return () => {};
  }, []); // eslint-disable-line

  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }

  // --- Capture frame BEFORE stopping stream ---
  const capture = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.videoWidth === 0) {
      setError("Camera not ready. Wait and try again.");
      return;
    }

    const w = v.videoWidth;
    const h = v.videoHeight;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // Draw FIRST while stream is live
    ctx.drawImage(v, 0, 0, w, h);
    const dataUrl = c.toDataURL("image/jpeg", 0.88);

    // Store refs
    capturedDataUrl.current = dataUrl;
    capturedW.current = w;
    capturedH.current = h;

    // NOW stop stream
    stopCamera();

    // Start detection
    setStep("processing");
    setProcessingMsg("Scanning for people...");
    setDetectedRects([]);
    setManualRects([]);
    setShowManualTools(false);

    detectPeople(dataUrl);
  }, [stream]); // eslint-disable-line

  // --- Face/person detection: blazeface first (precise), COCO-SSD fallback (wider coverage) ---
  async function detectPeople(dataUrl: string) {
    let rects: Rect[] = [];

    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = dataUrl;
    });

    // 1. Try blazeface first — precise face bounding boxes
    try {
      setProcessingMsg("Detecting faces...");
      const tf = await import("@tensorflow/tfjs-core");
      await import("@tensorflow/tfjs-backend-webgl");
      await tf.ready();

      const blazeface = await import("@tensorflow-models/blazeface");
      const model = await blazeface.load();
      const faces = await model.estimateFaces(img, false);

      rects = faces.map((pred) => {
        const start = pred.topLeft as [number, number];
        const end = pred.bottomRight as [number, number];
        const fw = end[0] - start[0];
        const fh = end[1] - start[1];
        // Moderate padding around the face
        const padX = fw * 0.25;
        const padY = fh * 0.25;
        return {
          x: Math.max(0, start[0] - padX),
          y: Math.max(0, start[1] - padY),
          w: fw + padX * 2,
          h: fh + padY * 2,
        };
      });
    } catch {
      // blazeface failed
    }

    // 2. If blazeface found nothing, try COCO-SSD for people at angles/distance
    if (rects.length === 0) {
      try {
        setProcessingMsg("Scanning for people...");
        const tf = await import("@tensorflow/tfjs-core");
        await tf.ready();

        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        const predictions = await model.detect(img);
        const people = predictions.filter((p) => p.class === "person" && p.score > 0.45);

        // Extract head region only (top 25% of body box)
        rects = people.map((p) => {
          const [bx, by, bw, bh] = p.bbox;
          const headH = bh * 0.25;
          return {
            x: Math.max(0, bx),
            y: Math.max(0, by),
            w: bw,
            h: headH,
          };
        });
      } catch {
        // Both failed — proceed without detection
      }
    }

    setDetectedRects(rects);
    setProcessingMsg(
      rects.length > 0
        ? `${rects.length} ${rects.length === 1 ? "person" : "people"} detected and blurred`
        : "No people detected"
    );
    setTimeout(() => setStep("review"), rects.length > 0 ? 600 : 300);
  }

  // --- Pixelation blur ---
  function pixelateRegion(ctx: CanvasRenderingContext2D, rect: Rect, canvasW: number, canvasH: number) {
    const x = Math.max(0, Math.round(rect.x));
    const y = Math.max(0, Math.round(rect.y));
    const w = Math.min(canvasW - x, Math.round(rect.w));
    const h = Math.min(canvasH - y, Math.round(rect.h));
    if (w <= 2 || h <= 2) return;

    const blockSize = Math.max(6, Math.round(Math.min(w, h) / 8));

    // Read pixels and pixelate
    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;

    for (let py = 0; py < h; py += blockSize) {
      for (let px = 0; px < w; px += blockSize) {
        // Sample center pixel of block
        const sx = Math.min(px + Math.floor(blockSize / 2), w - 1);
        const sy = Math.min(py + Math.floor(blockSize / 2), h - 1);
        const idx = (sy * w + sx) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Fill block with sampled color
        for (let by = py; by < Math.min(py + blockSize, h); by++) {
          for (let bx = px; bx < Math.min(px + blockSize, w); bx++) {
            const i = (by * w + bx) * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }
      }
    }

    ctx.putImageData(imageData, x, y);

    // Subtle border
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  // --- Render review canvas ---
  useEffect(() => {
    if (step !== "review" || !canvasRef.current || !capturedDataUrl.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const allRects = [...detectedRects, ...manualRects];
      if (drawing) allRects.push(drawing);
      for (const rect of allRects) {
        pixelateRegion(ctx, rect, img.width, img.height);
      }
    };
    img.src = capturedDataUrl.current;
  }, [step, detectedRects, manualRects, drawing]);

  // --- Confirm: build blob then either upload directly or call onDone ---
  function confirmPhoto() {
    const dataUrl = capturedDataUrl.current;
    if (!dataUrl || uploading) return;
    setUploading(true);
    setError(null);

    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setError("Image processing failed."); setUploading(false); return; }

        ctx.drawImage(img, 0, 0);

        const allRects = [...detectedRects, ...manualRects];
        for (const rect of allRects) {
          pixelateRegion(ctx, rect, img.width, img.height);
        }

        const redactionType: RedactionType =
          detectedRects.length > 0 ? "auto" :
          manualRects.length > 0 ? "manual" : "none";

        // Convert to blob via dataURL (more reliable than toBlob on mobile)
        const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const binaryStr = atob(jpegDataUrl.split(",")[1]);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: "image/jpeg" });

        // If we have upload config, upload directly (bypasses parent callback chain)
        if (uploadConfig) {
          const formData = new FormData();
          formData.append("file", blob, `evidence-${Date.now()}.jpg`);
          formData.append("jobId", uploadConfig.jobId);
          formData.append("completionId", uploadConfig.completionId);
          formData.append("redactionApplied", "true");
          formData.append("redactionType", redactionType);
          if (uploadConfig.itemId) {
            formData.append("itemId", uploadConfig.itemId);
            if (uploadConfig.checklistRunId) formData.append("checklistRunId", uploadConfig.checklistRunId);
          }

          const res = await fetch("/api/evidence/upload", { method: "POST", body: formData });
          if (res.ok) {
            onUploadComplete?.();
          } else {
            const data = await res.json().catch(() => ({}));
            setError(data.error || "Upload failed. Try again.");
            setUploading(false);
          }
        } else {
          // Fallback: use callback (for non-upload use cases)
          onDone(blob, redactionType);
        }
      } catch (e) {
        setError("Failed to process photo. Try retaking.");
        setUploading(false);
      }
    };
    img.onerror = () => { setError("Failed to load image."); setUploading(false); };
    img.src = dataUrl;
  }

  // --- Drawing handlers ---
  const getPoint = useCallback((clientX: number, clientY: number) => {
    const c = canvasRef.current;
    const cont = containerRef.current;
    if (!c || !cont) return { x: 0, y: 0 };
    const r = cont.getBoundingClientRect();
    return { x: (clientX - r.left) * (c.width / r.width), y: (clientY - r.top) * (c.height / r.height) };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!showManualTools) return;
    const p = getPoint(e.clientX, e.clientY);
    setDrawing({ x: p.x, y: p.y, w: 0, h: 0 });
  }, [getPoint, showManualTools]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing || !showManualTools) return;
    const p = getPoint(e.clientX, e.clientY);
    setDrawing({ ...drawing, w: p.x - drawing.x, h: p.y - drawing.y });
  }, [drawing, getPoint, showManualTools]);

  const onPointerUp = useCallback(() => {
    if (drawing && (Math.abs(drawing.w) > 10 || Math.abs(drawing.h) > 10)) {
      setManualRects((prev) => [...prev, {
        x: drawing.w >= 0 ? drawing.x : drawing.x + drawing.w,
        y: drawing.h >= 0 ? drawing.y : drawing.y + drawing.h,
        w: Math.abs(drawing.w),
        h: Math.abs(drawing.h),
      }]);
    }
    setDrawing(null);
  }, [drawing]);

  // --- Retake ---
  const retake = useCallback(() => {
    capturedDataUrl.current = null;
    setDetectedRects([]);
    setManualRects([]);
    setDrawing(null);
    setShowManualTools(false);
    setError(null);
    setUploading(false);
    setStep("camera");
    startCamera(facingMode);
  }, [facingMode]); // eslint-disable-line

  // --- Toggle camera ---
  const toggleCamera = useCallback(() => {
    stopCamera();
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  }, [facingMode, stream]); // eslint-disable-line

  // --- Error state ---
  if (step === "error") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 p-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center max-w-sm">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={onCancel} className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white">Close</button>
        </div>
      </div>
    );
  }

  const totalBlurred = detectedRects.length + manualRects.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium text-zinc-300">
          {step === "camera" ? "Take photo" : step === "processing" ? "Scanning..." : "Review photo"}
        </span>
        <button onClick={() => { stopCamera(); onCancel(); }} className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white">
          Cancel
        </button>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-black">
        {/* CAMERA */}
        {step === "camera" && (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
                  <p className="text-sm text-zinc-300">Starting camera...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
              <button
                onClick={capture}
                disabled={!videoReady}
                className="h-16 w-16 rounded-full border-4 border-white bg-white/20 shadow-lg active:scale-90 transition-transform disabled:opacity-30"
                aria-label="Take photo"
              />
            </div>
            <button onClick={toggleCamera} className="absolute bottom-6 right-6 rounded-full bg-zinc-800/80 p-3 text-white active:scale-90" aria-label="Switch camera">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            </button>
          </>
        )}

        {/* PROCESSING */}
        {step === "processing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
              <p className="text-base font-medium text-white">{processingMsg}</p>
              <p className="text-xs text-zinc-500">Detecting people automatically</p>
            </div>
          </div>
        )}

        {/* REVIEW */}
        {step === "review" && (
          <>
            <canvas
              ref={canvasRef}
              className={`h-full w-full object-contain ${showManualTools ? "cursor-crosshair" : ""}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={() => setDrawing(null)}
              style={{ touchAction: "none" }}
            />

            {/* Status banner */}
            <div className="absolute top-3 left-3 right-3">
              {detectedRects.length > 0 && (
                <div className="rounded-lg bg-emerald-600/90 px-3 py-2 text-center text-sm font-medium text-white shadow-lg">
                  {detectedRects.length} {detectedRects.length === 1 ? "person" : "people"} auto-blurred
                </div>
              )}
              {detectedRects.length === 0 && !showManualTools && (
                <div className="rounded-lg bg-zinc-800/90 px-3 py-2 text-center text-sm text-zinc-300 shadow-lg">
                  No people detected — photo is clear
                </div>
              )}
              {showManualTools && (
                <div className="rounded-lg bg-blue-600/90 px-3 py-2 text-center text-sm text-white shadow-lg">
                  Draw over areas to blur
                </div>
              )}
              {error && (
                <div className="mt-2 rounded-lg bg-red-600/90 px-3 py-2 text-center text-sm text-white shadow-lg">
                  {error}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent px-4 pb-6 pt-16">
              <div className="flex flex-col gap-2 max-w-md mx-auto">
                <button
                  onClick={confirmPhoto}
                  disabled={uploading}
                  className="w-full rounded-xl bg-emerald-600 py-4 text-base font-semibold text-white active:scale-[0.98] transition-transform min-h-[56px] disabled:opacity-50"
                >
                  {uploading
                    ? "Uploading..."
                    : totalBlurred > 0
                      ? `Use photo (${totalBlurred} area${totalBlurred > 1 ? "s" : ""} blurred)`
                      : "Use photo"
                  }
                </button>
                <div className="flex gap-2">
                  <button onClick={retake} disabled={uploading} className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-medium text-white active:scale-[0.98] disabled:opacity-50">
                    Retake
                  </button>
                  <button
                    onClick={() => setShowManualTools(!showManualTools)}
                    disabled={uploading}
                    className={`flex-1 rounded-xl border py-3 text-sm font-medium active:scale-[0.98] disabled:opacity-50 ${showManualTools ? "border-blue-500 bg-blue-600 text-white" : "border-zinc-700 bg-zinc-800 text-zinc-300"}`}
                  >
                    {showManualTools ? "Done drawing" : "Manual blur"}
                  </button>
                  {totalBlurred > 0 && (
                    <button
                      onClick={() => {
                        if (manualRects.length > 0) setManualRects((p) => p.slice(0, -1));
                        else if (detectedRects.length > 0) setDetectedRects((p) => p.slice(0, -1));
                      }}
                      disabled={uploading}
                      className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 active:scale-[0.98] disabled:opacity-50"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
