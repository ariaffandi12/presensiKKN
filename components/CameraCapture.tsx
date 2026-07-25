'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, SwitchCamera, CheckCircle2, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string | null) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);
    setIsStarting(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung oleh peramban ini.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Gagal mengakses kamera. Mohon izinkan akses kamera pada peramban Anda.');
    } finally {
      setIsStarting(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => {
      stopStream();
    };
  }, [facingMode, capturedImage]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera for natural selfie orientation
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    onCapture(dataUrl);
    stopStream();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    onCapture(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Hidden canvas for snapshot rasterization */}
      <canvas ref={canvasRef} className="hidden" />

      {capturedImage ? (
        // Preview State
        <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/50 group">
          <img
            src={capturedImage}
            alt="Preview Bukti Presensi"
            className="w-full h-72 object-cover rounded-2xl"
          />
          <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4" /> Foto Berhasil Diambil
          </div>

          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
            <button
              type="button"
              onClick={retakePhoto}
              className="bg-white text-slate-900 font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xl hover:bg-slate-100 transition transform hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 text-blue-600" /> Ambil Ulang Foto
            </button>
          </div>
        </div>
      ) : (
        // Live Camera View
        <div className="relative w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 aspect-video flex flex-col justify-center items-center">
          {cameraError ? (
            <div className="p-6 text-center text-rose-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm font-medium">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-72 object-cover rounded-2xl ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Top Controls Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCamera}
                  title="Ganti Kamera (Depan/Belakang)"
                  className="bg-slate-900/80 hover:bg-slate-900 text-white p-2.5 rounded-full border border-slate-700 shadow-lg transition backdrop-blur-md active:scale-95"
                >
                  <SwitchCamera className="w-4 h-4 text-blue-400" />
                </button>
              </div>

              <div className="absolute bottom-3 left-3 bg-slate-900/70 text-slate-300 text-xs px-3 py-1 rounded-full backdrop-blur-sm border border-slate-700">
                Mode: {facingMode === 'user' ? 'Kamera Depan' : 'Kamera Belakang'}
              </div>
            </>
          )}
        </div>
      )}

      {/* Action Controls */}
      {!capturedImage && !cameraError && (
        <div className="flex items-center justify-center gap-4 mt-2">
          <button
            type="button"
            onClick={takePhoto}
            disabled={isStarting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            <Camera className="w-5 h-5" /> Ambil Foto Bukti
          </button>
        </div>
      )}
    </div>
  );
}
