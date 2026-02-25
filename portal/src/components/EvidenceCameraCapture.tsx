"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RedactionType = "auto" | "manual" | "none";

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
  const [step, setStep] = useState<"camera" | "processing" | "review" | "error">("camera");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [capturedImageData, setCapturedImageData] = useState<ImageData | null>(null);
  const [capturedWidth, setCapturedWidth] = useState(0);
  const [capturedHeight, setCapturedHeight] = useState(0);
  const [detectedFaces, setDetectedFaces] = useState<Rect[]>([]);
  const [manualRects, setManualRects] = useState<Rect[]>([]);
  const [drawing, setDrawing] = useState<Rect | null>(null);
  const [showManualTools, setShowManualTools] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [processingMessage, setProcessingMessage] = useState("Processing...");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Camera management ---
  function startCamera(facing: "environment" | "user") {
    setVideoReady(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((newStream) => {
        setStream(newStream);
        const video = videoRef.current;
        if (video) {
          video.srcObject = newStream;
          const checkReady = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) setVideoReady(true);
          };
          video.addEventListener("loadeddata", checkReady, { once: true });
          video.addEventListener("canplay", checkReady, { once: true });
          if (video.videoWidth > 0) setVideoReady(true);
          const poll = setInterval(() => {
            if (video.videoWidth > 0) { setVideoReady(true); clearInterval(poll); }
          }, 200);
          setTimeout(() => clearInterval(poll), 8000);
        }
        setError(null);
      })
      .catch(() => {
        setError("Camera access denied or unavailable. Please allow camera access and try again.");
        setStep("error");
      });
  }

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      // Cleanup on unmount
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function stopAllTracks() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }

  // --- Capture: grab frame BEFORE stopping stream ---
  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) {
      setError("Camera not ready. Wait a moment and try again.");
      return;
    }

    // Draw frame to offscreen canvas FIRST (while stream is still active)
    const offscreen = document.createElement("canvas");
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    // Now grab the pixel data
    const imageData = ctx.getImageData(0, 0, w, h);
    setCapturedImageData(imageData);
    setCapturedWidth(w);
    setCapturedHeight(h);

    // NOW stop the stream (after we have the frame)
    stopAllTracks();

    // Move to processing
    setStep("processing");
    setProcessingMessage("Scanning for faces...");
    setDetectedFaces([]);
    setManualRects([]);
    setShowManualTools(false);

    // Run face detection
    runFaceDetection(offscreen, w, h);
  }, [stream]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runFaceDetection(canvas: HTMLCanvasElement, w: number, h: number) {
    let faces: Rect[] = [];

    try {
      // Try browser's native FaceDetector API first (Chrome 70+, Android)
      if ("FaceDetector" in window) {
        setProcessingMessage("Detecting faces...");
        const detector = new (window as any).FaceDetector({ maxDetectedFaces: 20 });
        const imageBitmap = await createImageBitmap(canvas);
        const detections = await detector.detect(imageBitmap);
        faces = detections.map((d: any) => ({
          x: Math.max(0, d.boundingBox.x - d.boundingBox.width * 0.15),
          y: Math.max(0, d.boundingBox.y - d.boundingBox.height * 0.15),
          w: d.boundingBox.width * 1.3,
          h: d.boundingBox.height * 1.3,
        }));
      }
    } catch {
      // Native API failed, try TensorFlow blazeface
    }

    if (faces.length === 0) {
      try {
        setProcessingMessage("Scanning with AI...");
        const tf = await import("@tensorflow/tfjs-core");
        await import("@tensorflow/tfjs-backend-webgl");
        const blazeface = await import("@tensorflow-models/blazeface");
        await tf.ready();
        const model = await blazeface.load();

        const img = new Image();
        img.crossOrigin = "anonymous";
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = dataUrl;
        });

        const predictions = await model.estimateFaces(img, false);
        faces = predictions.map((pred) => {
          const start = pred.topLeft as [number, number];
          const end = pred.bottomRight as [number, number];
          const pw = (end[0] - start[0]) * 0.2;
          const ph = (end[1] - start[1]) * 0.2;
          return {
            x: Math.max(0, start[0] - pw),
            y: Math.max(0, start[1] - ph),
            w: (end[0] - start[0]) + pw * 2,
            h: (end[1] - start[1]) + ph * 2,
          };
        });
      } catch {
        // AI detection failed — proceed without
      }
    }

    setDetectedFaces(faces);
    setProcessingMessage(
      faces.length > 0
        ? `${faces.length} face${faces.length > 1 ? "s" : ""} detected and blurred`
        : "No faces detected"
    );

    // Short delay so user sees the result message
    setTimeout(() => setStep("review"), faces.length > 0 ? 800 : 400);
  }

  // --- Render the review canvas with blur applied ---
  useEffect(() => {
    if (step !== "review" || !canvasRef.current || !capturedImageData) return;
    const canvas = canvasRef.current;
    canvas.width = capturedWidth;
    canvas.height = capturedHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw original image
    ctx.putImageData(capturedImageData, 0, 0);

    // Apply blur to detected faces + manual rects
    const allRects = [...detectedFaces, ...manualRects];
    if (drawing) allRects.push(drawing);

    for (const rect of allRects) {
      applyBlur(ctx, canvas, rect);
    }
  }, [step, capturedImageData, capturedWidth, capturedHeight, detectedFaces, manualRects, drawing]);

  function applyBlur(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, rect: Rect) {
    const x = Math.max(0, Math.round(rect.x));
    const y = Math.max(0, Math.round(rect.y));
    const w = Math.min(canvas.width - x, Math.round(rect.w));
    const h = Math.min(canvas.height - y, Math.round(rect.h));
    if (w <= 0 || h <= 0) return;

    // Pixelation blur: shrink region then scale back up
    const pixelSize = Math.max(8, Math.round(Math.min(w, h) / 6));
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Copy the region
    tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    // Pixelate: scale down then up
    ctx.imageSmoothingEnabled = false;
    const smallW = Math.ceil(w / pixelSize);
    const smallH = Math.ceil(h / pixelSize);

    const smallCanvas = document.createElement("canvas");
    smallCanvas.width = smallW;
    smallCanvas.height = smallH;
    const smallCtx = smallCanvas.getContext("2d");
    if (!smallCtx) return;

    smallCtx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, smallW, smallH);
    ctx.drawImage(smallCanvas, 0, 0, smallW, smallH, x, y, w, h);
    ctx.imageSmoothingEnabled = true;

    // Add tinted overlay for visibility
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  // --- Manual drawing handlers ---
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

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!showManualTools) return;
    const { x, y } = getPoint(e.clientX, e.clientY);
    setDrawing({ x, y, w: 0, h: 0 });
  }, [getPoint, showManualTools]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !showManualTools) return;
    const { x, y } = getPoint(e.clientX, e.clientY);
    setDrawing({ ...drawing, w: x - drawing.x, h: y - drawing.y });
  }, [drawing, getPoint, showManualTools]);

  const handlePointerUp = useCallback(() => {
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
    setCapturedImageData(null);
    setDetectedFaces([]);
    setManualRects([]);
    setDrawing(null);
    setShowManualTools(false);
    setError(null);
    setStep("camera");
    startCamera(facingMode);
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Confirm and upload ---
  const confirmPhoto = useCallback(() => {
    if (!capturedImageData) return;

    const canvas = document.createElement("canvas");
    canvas.width = capturedWidth;
    canvas.height = capturedHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.putImageData(capturedImageData, 0, 0);

    const allRects = [...detectedFaces, ...manualRects];
    for (const rect of allRects) {
      applyBlur(ctx, canvas, rect);
    }

    const redactionType: RedactionType = detectedFaces.length > 0 ? "auto" : manualRects.length > 0 ? "manual" : "none";

    canvas.toBlob(
      (blob) => {
        if (blob) onDone(blob, redactionType);
      },
      "image/jpeg",
      0.90
    );
  }, [capturedImageData, capturedWidth, capturedHeight, detectedFaces, manualRects, onDone]);

  // --- Toggle camera ---
  const toggleCamera = useCallback(() => {
    stopAllTracks();
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Error state ---
  if (step === "error") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 p-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center max-w-sm">
          <p className="text-red-400">{error}</p>
          <button type="button" onClick={onCancel} className="mt-4 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium text-zinc-300">
          {step === "camera" ? "Take photo" : step === "processing" ? "Processing..." : "Review & confirm"}
        </span>
        <button type="button" onClick={() => { stopAllTracks(); onCancel(); }} className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white">
          Cancel
        </button>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-hidden bg-black">
        {/* === CAMERA STEP === */}
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
            {/* Capture button */}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={capture}
                disabled={!videoReady}
                className="h-16 w-16 rounded-full border-4 border-white bg-white/20 shadow-lg active:scale-90 transition-transform disabled:opacity-30"
                aria-label="Take photo"
              />
            </div>
            {/* Camera toggle */}
            <button
              type="button"
              onClick={toggleCamera}
              className="absolute bottom-6 right-6 rounded-full bg-zinc-800/80 p-3 text-white active:scale-90"
              aria-label="Switch camera"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </>
        )}

        {/* === PROCESSING STEP === */}
        {step === "processing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-zinc-700 border-t-emerald-500" />
              <p className="text-base font-medium text-white">{processingMessage}</p>
              <p className="text-xs text-zinc-500">Auto-detecting and blurring faces</p>
            </div>
          </div>
        )}

        {/* === REVIEW STEP === */}
        {step === "review" && (
          <>
            <canvas
              ref={canvasRef}
              className={`h-full w-full object-contain ${showManualTools ? "cursor-crosshair" : ""}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => setDrawing(null)}
              style={{ touchAction: "none" }}
            />

            {/* Status banner */}
            <div className="absolute top-2 left-2 right-2">
              {detectedFaces.length > 0 && (
                <div className="rounded-lg bg-emerald-600/90 px-3 py-2 text-center text-sm font-medium text-white">
                  {detectedFaces.length} face{detectedFaces.length > 1 ? "s" : ""} auto-blurred
                </div>
              )}
              {detectedFaces.length === 0 && !showManualTools && (
                <div className="rounded-lg bg-zinc-800/90 px-3 py-2 text-center text-sm text-zinc-300">
                  No faces detected — photo is clear
                </div>
              )}
              {showManualTools && (
                <div className="rounded-lg bg-blue-600/90 px-3 py-2 text-center text-sm text-white">
                  Draw over areas to blur · {manualRects.length} area{manualRects.length !== 1 ? "s" : ""} added
                </div>
              )}
              {error && (
                <div className="mt-2 rounded-lg bg-red-500/90 px-3 py-2 text-center text-sm text-white">
                  {error}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent px-4 pb-6 pt-12">
              <div className="flex flex-col gap-2 max-w-md mx-auto">
                {/* Primary: Use photo */}
                <button
                  type="button"
                  onClick={confirmPhoto}
                  className="w-full rounded-xl bg-emerald-600 py-4 text-base font-semibold text-white active:scale-[0.98] transition-transform min-h-[56px]"
                >
                  {detectedFaces.length > 0 || manualRects.length > 0
                    ? `Use photo (${detectedFaces.length + manualRects.length} area${detectedFaces.length + manualRects.length > 1 ? "s" : ""} blurred)`
                    : "Use photo"}
                </button>

                {/* Secondary actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={retake}
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-medium text-white active:scale-[0.98]"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualTools(!showManualTools)}
                    className={`flex-1 rounded-xl border py-3 text-sm font-medium active:scale-[0.98] ${
                      showManualTools
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {showManualTools ? "Done drawing" : "Manual blur"}
                  </button>
                  {(manualRects.length > 0 || detectedFaces.length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (manualRects.length > 0) setManualRects((prev) => prev.slice(0, -1));
                        else setDetectedFaces((prev) => prev.slice(0, -1));
                      }}
                      className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 active:scale-[0.98]"
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
