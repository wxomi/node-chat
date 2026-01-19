"use client";

import React, { useCallback, useState, useMemo } from "react";
import Image from "next/image";
import useConfigStore from "../../../stores/config-store";
import { YouTubeIcon } from "@/constants/icons";
import { motion } from "motion/react";
import { useEffect } from "react";
import { YouTubeButtonAnimation } from "@/lib/animations/youtube-button-animation";
import { toast } from "sonner";
import { validateYouTubeUrl } from "../../../validations/shared/youtube-url.validation";

type YouTubeButtonProps = {
  isActive: boolean;
  onClickHandler: () => void;
  isMenuVisible?: boolean;
  nodeId?: string;
};

export const YouTubeButton: React.FC<YouTubeButtonProps> = React.memo(
  ({ isActive, onClickHandler, isMenuVisible, nodeId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [urlValue, setUrlValue] = useState("");

    const nodeConfig = useConfigStore((state) =>
      nodeId ? state.nodeConfigs?.[nodeId] : undefined
    );
    const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

    // Load existing URL from config store
    useEffect(() => {
      if (nodeConfig?.assets?.youtubeUrl) {
        setUrlValue(nodeConfig.assets.youtubeUrl);
      }
    }, [nodeConfig?.assets?.youtubeUrl]);

    const handleContainerClick = useCallback(() => {
      if (!isExpanded) {
        setIsExpanded(true);
        onClickHandler();
      }
    }, [isExpanded, onClickHandler]);

    const handleClose = useCallback(() => {
      // Show toast when saving
      const trimmedUrl = urlValue.trim();
      const originalUrl = nodeConfig?.assets?.youtubeUrl?.trim() || "";

      if (trimmedUrl === "") {
        // Only show "cleared" toast if there was an original URL
        if (originalUrl !== "") {
          toast.warning("YouTube URL cleared", {
            icon: (
              <Image src={YouTubeIcon} alt="YouTube" width={16} height={16} />
            ),
            duration: 2000,
          });
        }
      } else {
        // Validate YouTube URL using regex
        const validation = validateYouTubeUrl(trimmedUrl);

        if (validation.isValid) {
          // Console log whether it's a Short or a video
          console.log(
            `[YouTube URL Validation] Valid ${
              validation.isShorts ? "Shorts" : "video"
            } URL:`,
            {
              url: trimmedUrl,
              isShorts: validation.isShorts,
              videoId: validation.videoId,
            }
          );

          toast.success("Valid YouTube URL saved", {
            icon: (
              <Image src={YouTubeIcon} alt="YouTube" width={16} height={16} />
            ),
            duration: 2000,
          });
        } else {
          toast.error("Invalid YouTube URL - must be a valid YouTube URL", {
            icon: (
              <Image src={YouTubeIcon} alt="YouTube" width={16} height={16} />
            ),
            duration: 3000,
          });
        }
      }
      setIsExpanded(false);
    }, [urlValue, nodeConfig?.assets?.youtubeUrl]);

    const handleUrlChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setUrlValue(newUrl);

        if (!nodeId) {
          return;
        }

        const trimmedUrl = newUrl.trim();
        const currentConfig = useConfigStore.getState().nodeConfigs?.[nodeId];

        // Validate YouTube URL if not empty
        if (trimmedUrl) {
          const validation = validateYouTubeUrl(trimmedUrl);
          if (validation.isValid) {
            // Console log whether it's a Short or a video
            console.log(
              `[YouTube URL Validation] Valid ${
                validation.isShorts ? "Shorts" : "video"
              } URL:`,
              {
                url: trimmedUrl,
                isShorts: validation.isShorts,
                videoId: validation.videoId,
              }
            );
          }
        }

        // Save to config store immediately - PRESERVE existing assets
        updateNodeConfig(nodeId, {
          ...(currentConfig || {}),
          assets: {
            ...(currentConfig?.assets || {}),
            youtubeUrl: trimmedUrl || undefined,
          },
        });
      },
      [nodeId, updateNodeConfig]
    );

    useEffect(() => {
      if (!isMenuVisible) {
        setIsExpanded(false);
      }
    }, [isMenuVisible]);

    // Close input when switching to a different video source
    useEffect(() => {
      if (isActive === false && isExpanded) {
        setIsExpanded(false);
      }
    }, [isActive]);

    const inputMemoized = useMemo(
      () => (
        <motion.input
          animate={{ opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          type="text"
          placeholder="Paste URL"
          value={urlValue}
          onChange={handleUrlChange}
          className="bg-transparent border-none outline-none text-caption-desktop-medium text-foreground placeholder-muted-foreground w-full will-change-transform"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      [isExpanded, urlValue, handleUrlChange]
    );

    const labelMemoized = useMemo(
      () =>
        !isExpanded && (
          <span
            className={`text-caption-desktop-medium ${
              isActive ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            YouTube
          </span>
        ),
      [isExpanded, isActive]
    );

    const closeMemoized = useMemo(
      () =>
        isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-xs px-1 cursor-pointer"
          >
            →
          </button>
        ),
      [isExpanded, handleClose]
    );

    return (
      <YouTubeButtonAnimation
        isActive={isActive}
        isExpanded={isExpanded}
        hasUrl={!!urlValue.trim()}
        onClick={handleContainerClick}
      >
        <Image src={YouTubeIcon} alt="YouTube" width={20} height={20} />
        {labelMemoized}
        {inputMemoized}
        {closeMemoized}
      </YouTubeButtonAnimation>
    );
  }
);

YouTubeButton.displayName = "YouTubeButton";

