"use client";

import React, { useEffect, memo, useCallback } from "react";
import Image from "next/image";
import { DownloadIcon } from "@/constants/icons";
import { LoaderIcon } from "lucide-react";
import { toast } from "sonner";

type VideoPreviewProps = {
  videoUrl?: string;
  isGenerating: boolean;
  onVideoClick?: () => void;
  orientation?: "square" | "landscape" | "portrait";
  height?: number;
};

const VideoPreview = memo<VideoPreviewProps>(
  ({ videoUrl, isGenerating, onVideoClick, orientation, height }) => {
    useEffect(() => {
      // Component mounted/props updated
    }, [videoUrl, isGenerating]);

    const handleDownload = useCallback(async () => {
      if (!videoUrl) return;

      try {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `generated-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Video downloaded successfully!");
      } catch (error) {
        console.error("Download error:", error);
        toast.error("Failed to download video");
      }
    }, [videoUrl]);

    const containerClassName = `mb-3 w-full bg-accent ${
      !videoUrl && "border border-[#27293D]"
    } rounded-lg overflow-hidden flex items-center justify-center relative group ${
      height ? "transition-[height] duration-300 ease-in-out" : "min-h-[300px]"
    }`;

    const containerStyle = {
      ...(height && { height: `${height}px` }),
    };

    return (
      <div className={containerClassName} style={containerStyle}>
        {videoUrl ? (
          <>
            <video
              src={videoUrl}
              className="w-full h-full object-cover cursor-pointer"
              controls
              controlsList="nodownload"
            />
            {/* Top gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none z-10" />
            {/* Bottom gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none z-10" />
            {/* Fullscreen icon */}
            <div
              className="absolute top-3 right-3 z-20 hover:bg-white/30 rounded-sm p-1 cursor-pointer transition-colors duration-150 ease-out pointer-events-auto"
              onClick={onVideoClick}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1h3v1H2v2H1V1zm8 0h3v3h-1V2h-2V1zM1 8h1v2h2v1H1v-3zm9 0h1v3h-3v-1h2v-2z"
                  fill="white"
                />
              </svg>
            </div>
            {/* Download icon */}
            <div
              className="absolute top-3 left-3 z-20 hover:bg-white/30 rounded-sm p-1 cursor-pointer transition-colors duration-150 ease-out pointer-events-auto"
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
            No video generated
          </span>
        )}
      </div>
    );
  }
);

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;
