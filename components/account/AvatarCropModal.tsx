"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

type Props = {
  imageUrl: string;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

const CROP_SIZE = 280;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function createImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement) {
  return new Promise<string>((resolve) => {
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob?.type === "image/webp") {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result));
          reader.readAsDataURL(webpBlob);
          return;
        }

        resolve(canvas.toDataURL("image/png"));
      },
      "image/webp",
      0.9,
    );
  });
}

async function getCroppedAvatarDataUrl(imageUrl: string, crop: Area) {
  const image = await createImage(imageUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  if (!context) {
    return "";
  }

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return canvasToDataUrl(canvas);
}

export default function AvatarCropModal({
  imageUrl,
  onCancel,
  onConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;

    setIsSaving(true);
    const dataUrl = await getCroppedAvatarDataUrl(imageUrl, croppedAreaPixels);
    setIsSaving(false);

    if (dataUrl) {
      onConfirm(dataUrl);
    }
  }

  function centerImage() {
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
  }

  return (
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-black/75 px-6 py-8 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Cancel avatar positioning"
        onClick={onCancel}
        className="absolute inset-0 cursor-default"
      />

      <section className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
        <div className="mb-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
            Profile Image
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
            Position your avatar
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Drag and zoom to center your profile image.
          </p>
        </div>

        <div className="relative h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#2A2A2A]">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            cropSize={{ width: CROP_SIZE, height: CROP_SIZE }}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            showGrid={false}
            restrictPosition
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedPixels) =>
              setCroppedAreaPixels(croppedPixels)
            }
            classes={{
              containerClassName: "bg-[#2A2A2A]",
              cropAreaClassName:
                "border border-[#D4AF37]/55 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]",
            }}
          />
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
            Zoom
          </span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-[#D4AF37]"
          />
        </label>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={centerImage}
            className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-400 transition hover:border-white/20 hover:text-white"
          >
            Center image
          </button>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-400 transition hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!croppedAreaPixels || isSaving}
              className="rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.16)] transition hover:bg-[#F9D976] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save photo"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
