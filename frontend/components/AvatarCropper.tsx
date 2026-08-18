"use client";

import Cropper, { type Area } from "react-easy-crop";
import { useState } from "react";

interface AvatarCropperProps {
  onCropComplete?: (blob: Blob | null) => void;
}

const AvatarCropper = ({ onCropComplete }: AvatarCropperProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const onCropChange = (
    _: Area,
    croppedAreaPixels: Area
  ) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (!image || !croppedAreaPixels) return;

    const blob = await getCroppedImg(image, croppedAreaPixels);
    onCropComplete?.(blob);
    setImage(null);
  };

  const handleCancel = () => {
    setImage(null);
    setCroppedAreaPixels(null);
    onCropComplete?.(null);
  };

  return (
    <>
      <label
        htmlFor="avatar-upload"
        className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Change photo
      </label>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
        id="avatar-upload"
      />

      {image && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/75 p-4">
          <div className="relative size-[min(400px,calc(100vw-2rem))]">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropChange}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={handleCropConfirm}
            >
              Crop & Save
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export const getCroppedImg = async (
  imageSrc: string,
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
) => {
  const image = new Image();

  image.src = imageSrc;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement("canvas");

  canvas.width = crop.width;
  canvas.height = crop.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/jpeg");
  });
}

export default AvatarCropper;
