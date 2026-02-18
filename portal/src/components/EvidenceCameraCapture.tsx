"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RedactionType = "face" | "person" | "manual";

interface EvidenceCameraCaptureProps {
  onDone: (blob: Blob, redactionType: RedactionType) => void;
  onCancel: () => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function EvidenceCameraCapture({ onDone, onCancel }: EvidenceCameraCaptureProps) {
  const [step, setStep] = useState<"camera" | "redact" | "error">("camera");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [drawing, setDrawing] = useState<Rect | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Start camera
  useEffect(() => {
    let s: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        s = stream;
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(null);
      })
      .catch((err) => {
        setError("Camera access denied or unavailable.");
        setStep("error");
      });
    return () => {
      if (s) s.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !stream) return;
    video.pause();
    stopStream();
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setCapturedUrl(canvas.toDataURL("image/jpeg", 0.92));
    setStep("redact");
  }, [stream, stopStream]);

  const retake = useCallback(() => {
    setCapturedUrl(null);
    setRects([]);
    setDrawing(null);
    setStep("camera");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((newStream) => {
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      })
      .catch(() => setError("Camera unavailable"));
  }, []);

  const getPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const cont = containerRef.current;
    if (!canvas || !cont) return { x: 0, y: 0 };
    const rect = cont.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const { x, y } = getPoint(e.clientX, e.clientY);
      setDrawing({ x, y, w: 0, h: 0 });
    },
    [getPoint]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawing) return;
      const { x, y } = getPoint(e.clientX, e.clientY);
      setDrawing({
        ...drawing,
        w: x - drawing.x,
        h: y - drawing.y,
      });
    },
    [drawing, getPoint]
  );

  const handlePointerUp = useCallback(() => {
    if (drawing && (Math.abs(drawing.w) > 5 || Math.abs(drawing.h) > 5)) {
      const normalized = {
        x: drawing.w >= 0 ? drawing.x : drawing.x + drawing.w,
        y: drawing.h >= 0 ? drawing.y : drawing.y + drawing.h,
        w: Math.abs(drawing.w),
        h: Math.abs(drawing.h),
      };
      setRects((prev) => [...prev, normalized]);
    }
    setDrawing(null);
  }, [drawing]);


  const confirmAndUpload = useCallback(
    (noRedactionNeeded: boolean) => {
      const allRects = drawing ? [...rects, drawing] : rects;
      if (!noRedactionNeeded && allRects.length === 0) {
        setError("Draw at least one area to redact, or confirm “No sensitive content”.");
        return;
      }
      if (!capturedUrl) return;
      setError(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        if (!noRedactionNeeded) {
          allRects.forEach((r) => {
            ctx.fillStyle = "black";
            ctx.fillRect(r.x, r.y, r.w, r.h);
          });
        }
        canvas.toBlob(
          (blob) => {
            if (blob) onDone(blob, "manual");
          },
          "image/jpeg",
          0.92
        );
      };
      img.src = capturedUrl;
    },
    [capturedUrl, rects, drawing, onDone]
  );

  // Redraw canvas when captured image + rects change
  useEffect(() => {
    if (step !== "redact" || !canvasRef.current || !capturedUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      [...rects, drawing].filter(Boolean).forEach((r) => {
        ctx.fillStyle = "black";
        ctx.fillRect(r!.x, r!.y, r!.w, r!.h);
      });
    };
    img.src = capturedUrl;
  }, [step, capturedUrl, rects, drawing]);

  if (step === "error") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 p-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center max-w-sm">
          <p className="text-red-400">{error}</p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium text-zinc-300">
          {step === "camera" ? "Take photo" : "Redact then use photo"}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-black">
        {step === "camera" && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-contain"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                type="button"
                onClick={capture}
                className="h-14 w-14 rounded-full border-4 border-white bg-white/20 shadow-lg"
                aria-label="Capture"
              />
            </div>
          </>
        )}

        {step === "redact" && (
          <>
            <canvas
              ref={canvasRef}
              className="h-full w-full object-contain cursor-crosshair"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => setDrawing(null)}
              style={{ touchAction: "none" }}
            />
            {error && (
              <p className="absolute top-2 left-2 right-2 rounded bg-red-500/90 px-2 py-1 text-center text-sm text-white">
                {error}
              </p>
            )}
            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
              <p className="text-xs text-zinc-400">
                Draw over any areas to redact (people, faces, sensitive info)
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={retake}
                  className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-white"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={() => confirmAndUpload(false)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Use photo (redacted)
                </button>
                <button
                  type="button"
                  onClick={() => confirmAndUpload(true)}
                  className="rounded-lg border border-zinc-500 bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                >
                  No sensitive content
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
