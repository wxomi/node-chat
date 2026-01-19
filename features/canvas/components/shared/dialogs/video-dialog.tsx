"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { VIDEO_MENU_BAR_ITEMS } from "../../../constants/nodes/video/video-menu-bar";
import { CopyIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type VideoDialogProps = {
  isOpen: boolean;
  videoUrl?: string;
  onClose: () => void;
};

const VideoDialog: React.FC<VideoDialogProps> = ({
  isOpen,
  videoUrl,
  onClose,
}) => {
  const [isCopied, setIsCopied] = useState(false);

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

  const handleCopyLink = useCallback(() => {
    if (!videoUrl) return;

    navigator.clipboard.writeText(videoUrl);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
  }, [videoUrl]);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl border-0 bg-transparent p-0 shadow-none w-full h-full"
        showCloseButton={false}
      >
        <div className="flex items-center justify-center">
          {videoUrl && (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-auto max-h-[85vh] object-contain scale-150"
            />
          )}
        </div>
        {/* Menu bar - absolute at top center */}
        {isOpen && (
          <ButtonGroup className="flex flex-row h-fit w-fit absolute top-3 left-1/2 transform -translate-x-1/2 z-50 border border-border rounded-lg">
            {VIDEO_MENU_BAR_ITEMS.map((item, index) => (
              <React.Fragment key={item.id}>
                {item.action === "close" ? (
                  <Button
                    onClick={onClose}
                    className="bg-popover cursor-pointer hover:bg-accent"
                  >
                    <Image
                      src={item.icon!}
                      alt={item.id}
                      width={16}
                      height={16}
                      className="brightness-0 invert"
                    />
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => {
                            if (item.action === "download") handleDownload();
                            else if (item.action === "copy") handleCopyLink();
                          }}
                          disabled={!videoUrl}
                          className="bg-popover cursor-pointer hover:bg-accent"
                        >
                          {item.action === "copy" ? (
                            isCopied ? (
                              <CheckIcon className="size-4" />
                            ) : (
                              <CopyIcon className="size-4" />
                            )
                          ) : item.isIconFromLucide ? (
                            <span>{item.label}</span>
                          ) : (
                            <Image
                              src={item.icon!}
                              alt={item.id}
                              width={16}
                              height={16}
                              className="brightness-0 invert"
                            />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {item.action === "copy" && isCopied
                            ? "Copied!"
                            : item.tooltip}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {index < VIDEO_MENU_BAR_ITEMS.length - 1 && (
                  <ButtonGroupSeparator className="border-r border-border" />
                )}
              </React.Fragment>
            ))}
          </ButtonGroup>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoDialog;
