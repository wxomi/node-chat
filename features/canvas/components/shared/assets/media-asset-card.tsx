"use client";

import React, { memo, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ImageIcon, VideoIcon, MusicIcon } from "@/constants/icons";
import ImageDialog from "../dialogs/image-dialog";
import VideoDialog from "../dialogs/video-dialog";

type MediaAssetCardProps = {
  assetId: string;
  fileName: string;
  type: "image" | "video" | "audio";
  previewUrl?: string;
  onSelected?: boolean;
  isConnected?: boolean;
};

const ASSET_ICONS = {
  image: ImageIcon,
  video: VideoIcon,
  audio: MusicIcon,
} as const;

const ASSET_LABELS = {
  image: "Image",
  video: "Video",
  audio: "Audio",
} as const;

const MediaAssetCard: React.FC<MediaAssetCardProps> = memo(
  ({
    assetId,
    fileName,
    type,
    previewUrl,
    onSelected = false,
    isConnected = false,
  }) => {
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState(false);
    const icon = ASSET_ICONS[type];
    const label = ASSET_LABELS[type];

    const handlePreviewClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (type === "image" && previewUrl) {
        setIsImagePreviewOpen(true);
      } else if (type === "video" && previewUrl) {
        setIsVideoPreviewOpen(true);
      }
    };

    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ willChange: "opacity, transform" }}
        >
          <div className="flex items-center gap-3 p-2 rounded-lg border border-border">
            {/* Asset Preview or Icon */}
            {(type === "image" || type === "video") && previewUrl ? (
              <div
                className="w-8 h-8 rounded overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity relative group"
                onClick={handlePreviewClick}
              >
                {type === "image" ? (
                  <img
                    src={previewUrl}
                    alt={fileName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <video
                      src={previewUrl}
                      className="w-full h-full object-cover"
                    />
                  </>
                )}
              </div>
            ) : (
              <Image
                src={icon}
                alt={label}
                width={20}
                height={20}
                className="text-muted-foreground"
              />
            )}

            {/* Asset Preview/Info */}
            <div className="flex-col flex-1">
              <div className="text-[10px] font-medium truncate">{fileName}</div>
              <div className="text-[8px] text-muted-foreground">{label}</div>
            </div>
          </div>
        </motion.div>

        {/* Image Dialog */}
        <ImageDialog
          isOpen={isImagePreviewOpen}
          imageUrl={previewUrl}
          onClose={() => setIsImagePreviewOpen(false)}
        />

        {/* Video Dialog */}
        <VideoDialog
          isOpen={isVideoPreviewOpen}
          videoUrl={previewUrl}
          onClose={() => setIsVideoPreviewOpen(false)}
        />
      </>
    );
  }
);

MediaAssetCard.displayName = "MediaAssetCard";

export default MediaAssetCard;
