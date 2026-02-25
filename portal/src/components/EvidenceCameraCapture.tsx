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

async function detectFaces(imageUrl: string): Promise<Rect[]> {
  try {
    const tf = await import("@tensorflow/tfjs-core");
    await import("@tensorflow/tfjs-backend-webgl");
    const blazeface = await import("@tensorflow-models/blazeface");

    await tf.ready();
    const model = await blazeface.load();

    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageUrl;
    });

    const predictions = await model.estimateFaces(img, false);

    return predictions.map((pred) => {
      const start = pred.topLeft as [number, number];
      const end = pred.bottomRight as [number, number];
      const padX = (end[0] - start[0]) * 0.2;
      const padY = (end[1] - start[1]) * 0.2;
      return {
        x: Math.max(0, start[0] - padX),
        y: Math.max(0, start[1] - padY),
        w: (end[0] - start[0]) + padX * 2,
        h: (end[1] - start[1]) + padY * 2,
      };
    });
  } catch {
    return [];
  }
}

export default function EvidenceCameraCapture({ onDone, onCancel }: EvidenceCameraCaptureProps) {
  const [step, setStep] = useState<"camera" | "redact" | "error">("camera");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [drawing, setDrawing] = useState<Rect | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [autoDetectedCount, setAutoDetectedCount] = useState(0);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function startCamera(facing: "environment" | "user") {
    setVideoReady(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((newStream) => {
        setStream(newStream);
        const video = videoRef.current;
        if (video) {
          video.srcObject = newStream;
          const onReady = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) setVideoReady(true);
          };
          video.addEventListener("loadeddata", onReady, { once: true });
          video.addEventListener("loadedmetadata", onReady, { once: true });
          video.addEventListener("canplay", onReady, { once: true });
          if (video.videoWidth > 0 && video.videoHeight > 0) setVideoReady(true);
          const pollId = setInterval(() => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              setVideoReady(true);
              clearInterval(pollId);
            }
          }, 150);
          setTimeout(() => clearInterval(pollId), 6000);
        }
        setError(null);
      })
      .catch(() => {
        setError("Camera access denied or unavailable.");
        setStep("error");
      });
  }

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      // Cleanup handled by stopStream
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) {
      setError("Camera not ready. Wait a moment and try again.");
      return;
    }
    stopStream();
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedUrl(dataUrl);
    setError(null);
    setDetecting(true);
    detectFaces(dataUrl).then((faces) => {
      setRects(faces);
      setAutoDetectedCount(faces.length);
      setDetecting(false);
      setStep("redact");
    });
  }, [stream, stopStream]);

  const retake = useCallback(() => {
    setCapturedUrl(null);
    setRects([]);
    setDrawing(null);
    setError(null);
    setAutoDetectedCount(0);
    setStep("camera");
    startCamera(facingMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const toggleCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    startCamera(newFacing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, stream]);

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
        setError("Draw at least one area to redact, or confirm no people are visible.");
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
            {!videoReady && (
              <p className="absolute left-2 right-2 top-2 rounded bg-zinc-800/90 px-3 py-2 text-center text-sm text-zinc-300">
                Preparing camera…
              </p>
            )}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                type="button"
                onClick={capture}
                disabled={!videoReady}
                className="h-14 w-14 rounded-full border-4 border-white bg-white/20 shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                aria-label="Capture"
              />
            </div>
            <button
              type="button"
              onClick={toggleCamera}
              className="absolute bottom-4 right-4 rounded-full bg-zinc-800/80 p-3 text-white"
              aria-label="Toggle camera"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </>
        )}

        {detecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
              <p className="text-sm text-zinc-300">Scanning for faces...</p>
            </div>
          </div>
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
              {autoDetectedCount > 0 && (
                <p className="text-xs text-emerald-400 mb-1">
                  {autoDetectedCount} face{autoDetectedCount > 1 ? "s" : ""} auto-detected and blurred. Adjust if needed.
                </p>
              )}
              <p className="text-xs text-zinc-400">
                Draw over any areas to redact (people, faces, sensitive info)
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setRects((prev) => prev.slice(0, -1))}
                  disabled={rects.length === 0}
                  className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-30"
                >
                  Undo ({rects.length})
                </button>
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
                  onClick={() => {
                    if (confirm("I confirm this photo contains no people, faces, or identifying information. This declaration is audited.")) {
                      confirmAndUpload(true);
                    }
                  }}
                  className="rounded-lg border border-zinc-500 bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                >
                  No people visible (audited)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
