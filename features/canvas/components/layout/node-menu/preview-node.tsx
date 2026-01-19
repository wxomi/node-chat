import React, { memo, useCallback, useState } from "react";
import Image from "next/image";
import { StaticImageData } from "next/image";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import NodeMenuTooltip from "./node-menu-tooltip";

export type PreviewNodeProps = {
  icon: StaticImageData;
  title: string;
  nodeType: string;
  iconSize?: number;
  className?: string;
  disabled?: boolean;
};

export const PreviewNode: React.FC<PreviewNodeProps> = memo(
  ({
    icon,
    title,
    nodeType,
    iconSize = 18,
    className = "",
    disabled = false,
  }) => {
    const [isDragging, setIsDragging] = useState(false);

    // Memoize the drag start handler to prevent unnecessary re-renders
    const onDragStart = useCallback(
      (event: React.DragEvent) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        setIsDragging(true);
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
      },
      [nodeType, disabled]
    );

    const onDragEnd = useCallback(() => {
      setIsDragging(false);
    }, []);

    return (
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <div
            draggable={!disabled}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={cn(
              "size-24 border border-border rounded-lg flex items-center justify-center flex-col gap-1.5 px-2 transition-all",
              disabled
                ? "opacity-40 grayscale cursor-not-allowed"
                : "cursor-grab active:cursor-grabbing hover:bg-sidebar-border",
              isDragging ? "bg-sidebar-border opacity-40" : "",
              className
            )}
          >
            <Image
              src={icon}
              alt={title}
              width={iconSize}
              height={iconSize}
              className="brightness-0 invert"
            />
            <div className="text-[12px] text-center">{title}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={12}
          className="bg-muted text-white border-border text-caption-desktop-regular py-3 px-3 rounded-lg"
        >
          <NodeMenuTooltip nodeType={nodeType} />
        </TooltipContent>
      </Tooltip>
    );
  }
);

PreviewNode.displayName = "PreviewNode";

export default PreviewNode;
