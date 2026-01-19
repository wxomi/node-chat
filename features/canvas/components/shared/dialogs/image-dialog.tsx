"use client";

import React, { useCallback, useState, useEffect } from "react";
import Image from "next/image";
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
import { IMAGE_MENU_BAR_ITEMS } from "../../../constants/nodes/image/image-menu-bar";
import { CopyIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

type ImageDialogProps = {
  isOpen: boolean;
  imageUrl?: string;
  onClose: () => void;
};

const ImageDialog: React.FC<ImageDialogProps> = ({
  isOpen,
  imageUrl,
  onClose,
}) => {
  const [isCopied, setIsCopied] = useState(false);

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

  const handleCopyLink = useCallback(() => {
    if (!imageUrl) return;

    navigator.clipboard.writeText(imageUrl);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
  }, [imageUrl]);

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
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="Full resolution image"
              width={870}
              height={870}
              unoptimized
              className="scale-[1.5]"
              priority
            />
          )}
        </div>
        {/* Custom close button in top centre */}
        {/* Menu bar - absolute at top center */}
        {isOpen && (
          <ButtonGroup className="flex flex-row h-fit w-fit absolute top-3 left-1/2 transform -translate-x-1/2 z-50 border border-border rounded-lg">
            {IMAGE_MENU_BAR_ITEMS.map((item, index) => (
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
                          disabled={!imageUrl}
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

                {index < IMAGE_MENU_BAR_ITEMS.length - 1 && (
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

export default ImageDialog;
