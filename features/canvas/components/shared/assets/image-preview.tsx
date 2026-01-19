"use client";

import React, { useEffect, memo, useCallback } from "react";
import Image from "next/image";
import { DiagonalIcon, DownloadIcon } from "@/constants/icons";
import { LoaderIcon } from "lucide-react";
import { toast } from "sonner";

type ImagePreviewProps = {
  imageUrl?: string;
  isGenerating: boolean;
  onImageClick?: () => void;
  orientation?: "portrait" | "landscape" | "square";
  height?: number;
};

const ImagePreview = memo<ImagePreviewProps>(
  ({ imageUrl, isGenerating, onImageClick, orientation, height }) => {
    useEffect(() => {
      // Component mounted/props updated
    }, [imageUrl, isGenerating]);

    const handleDownload = useCallback(async () => {
      if (!imageUrl) return;

      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Image downloaded successfully!");
      } catch (error) {
        console.error("Download error:", error);
        toast.error("Failed to download image");
      }
    }, [imageUrl]);

    const containerClassName = `mb-3 w-full bg-accent ${
      !imageUrl && "border border-[#27293D]"
    } rounded-lg overflow-hidden flex items-center justify-center relative group ${
      height ? "transition-[height] duration-300 ease-in-out" : "min-h-[400px]"
    }`;

    const containerStyle = {
      ...(height && { height: `${height}px` }),
    };

    return (
      <div className={containerClassName} style={containerStyle}>
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt="Generated image"
              fill
              unoptimized
              className="object-cover no-repeat cursor-pointer transition-opacity"
              priority={false}
            />
            {/* Top gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none z-10" />
            {/* Bottom gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none z-10" />
            {/* Zoom icon */}
            <div
              className="absolute top-3 right-3 z-20 hover:bg-white/30 rounded-sm p-1 cursor-pointer transition-colors duration-150 ease-out pointer-events-auto"
              onClick={onImageClick}
            >
              <Image
                src={DiagonalIcon}
                alt="zoom"
                width={12}
                height={12}
                className="brightness-0 invert"
              />
            </div>
            {/* Download icon */}
            <div
              className="absolute bottom-3 right-3 z-20 hover:bg-white/30 rounded-sm p-1 cursor-pointer transition-colors duration-150 ease-out pointer-events-auto"
              onClick={handleDownload}
            >
              <Image
                src={DownloadIcon}
                alt="download"
                width={12}
                height={12}
                className="brightness-0 invert"
              />
            </div>
          </>
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <LoaderIcon className="text-secondary-foreground size-4 animate-spin" />
            <span className="text-xs text-secondary-foreground">
              Generating...
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground py-8">
            No image generated
          </span>
        )}
      </div>
    );
  }
);

ImagePreview.displayName = "ImagePreview";

export default ImagePreview;
