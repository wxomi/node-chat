"use client";

import React, {
  useCallback,
  useEffect,
  memo,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUpdateNodeInternals } from "@xyflow/react";
import useFlowStore from "../../../stores/canvas-store";
import useConfigStore from "../../../stores/config-store";
import { cn } from "@/lib/utils";
import { NodeFlowConfig } from "../../../types/sidebar.types";
import AssetHandle from "../../shared/connections/asset-handle";
import { NodeAnimation } from "@/lib/animations/node-animation";
import ImageDialog from "../../shared/dialogs/image-dialog";
import { handleUploadAsset } from "../../../handlers/upload";
import Image from "next/image";
import { ImportIcon } from "lucide-react";
import MediaAssetCard from "../../shared/assets/media-asset-card";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  VALID_EXTENSIONS,
  FILE_TYPE_INFO,
} from "../../../constants/upload/upload-constants";
import {
  getFileExtension,
  isValidFileExtension,
  getIconConfig,
} from "../../../lib/upload";
import { extractDimensionsFromFile } from "../../../lib/shared";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";

type UploadNodeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const AnimatedIcon: React.FC<{
  fileType: "image" | "video" | "audio" | null;
  isDragOver: boolean;
}> = ({ fileType, isDragOver }) => {
  const config = getIconConfig(fileType, isDragOver);

  if (config.icon) {
    return (
      <motion.div
        key={config.key}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="w-[18px] h-[18px] flex items-center justify-center"
        style={{ willChange: "opacity, transform" }}
      >
        <Image
          src={config.icon}
          alt={config.alt}
          width={18}
          height={18}
          className="text-muted-foreground w-[18px] h-[18px] object-contain"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      key={config.key}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="w-[18px] h-[18px] flex items-center justify-center"
      style={{ willChange: "opacity, transform" }}
    >
      <ImportIcon
        className="text-muted-foreground w-[18px] h-[18px]"
        size={18}
      />
    </motion.div>
  );
};

const UploadNode: React.FC<UploadNodeProps> = memo(
  ({ id, selected, dragging }) => {
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragOverFileType, setDragOverFileType] = useState<
      "image" | "video" | "audio" | null
    >(null);
    const [hasDetectedFileType, setHasDetectedFileType] = useState(false);
    const [uploadedAssets, setUploadedAssets] = useState<
      Array<{
        id: string;
        type: "image" | "video" | "audio";
        fileName: string;
        previewUrl: string;
        filePath: string;
        isUploading: boolean;
        width?: number;
        height?: number;
      }>
    >([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const updateNodeInternals = useUpdateNodeInternals();
    const setSelectedNodeId = useConfigStore(
      (state) => state.setSelectedNodeId
    );

    // Only subscribe to node DATA
    const nodeData = useFlowStore((s) => {
      const node = s.nodes.find((n) => n.id === id);
      return node?.data;
    });

    const edges = useFlowStore((s) => s.edges);

    // Memoize flowConfig
    const flowConfig = useMemo(
      () => nodeData?.flowConfig as NodeFlowConfig | null,
      [nodeData?.flowConfig]
    );

    // Get node disabled state based on connection compatibility
    const { isNodeDisabled } = useNodeDisabledState({
      nodeId: id,
      flowConfig,
    });

    const [isHovered, setIsHovered] = useState<boolean>(false);

    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    // Use ref to track if we're updating from external source (prevents circular updates)
    const isExternalUpdateRef = useRef(false);
    // Use ref to store current asset IDs for comparison (avoids stale closure issues)
    const currentAssetIdsRef = useRef<string>("");

    // Initialize uploadedAssets from node data (for external updates like canvas file drop)
    useEffect(() => {
      const nodeUploadedAssets = nodeData?.uploadedAssets as
        | Array<{
            id: string;
            type: "image" | "video" | "audio";
            fileName: string;
            previewUrl: string;
            filePath: string;
            isUploading: boolean;
            width?: number;
            height?: number;
          }>
        | undefined;

      // Only update if node data has assets and they're different from current state
      if (nodeUploadedAssets) {
        // Check if arrays are different by comparing IDs
        const nodeIds = nodeUploadedAssets
          .map((a) => a.id)
          .sort()
          .join(",");

        if (currentAssetIdsRef.current !== nodeIds) {
          // Mark as external update to prevent sync back to store
          isExternalUpdateRef.current = true;
          setUploadedAssets(nodeUploadedAssets);
          // Update ref with new IDs
          currentAssetIdsRef.current = nodeIds;
          // Reset flag after state update completes
          setTimeout(() => {
            isExternalUpdateRef.current = false;
          }, 0);
        }
      }
    }, [nodeData?.uploadedAssets]); // REMOVED uploadedAssets from dependencies to break circular dependency

    // Update ref when local state changes (for accurate comparison)
    useEffect(() => {
      const currentIds = uploadedAssets
        .map((a) => a.id)
        .sort()
        .join(",");
      currentAssetIdsRef.current = currentIds;
    }, [uploadedAssets]);

    // Sync uploadedAssets to node data for connection line color detection
    // Only sync when NOT an external update (prevents circular updates)
    useEffect(() => {
      if (isExternalUpdateRef.current) {
        return; // Skip sync if this is from external update
      }

      const updateNodeStore = useFlowStore.getState().updateNodeData;
      updateNodeStore(id, { uploadedAssets });
    }, [id, uploadedAssets]);

    // Update node internals when uploadedAssets changes (fixes handle positioning after paste)
    useEffect(() => {
      // Use requestAnimationFrame to ensure DOM has updated and node is fully rendered
      // Double RAF ensures layout is complete before React Flow measures
      let rafId1: number;
      let rafId2: number;

      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          updateNodeInternals(id);
        });
      });

      return () => {
        if (rafId1) cancelAnimationFrame(rafId1);
        if (rafId2) cancelAnimationFrame(rafId2);
      };
    }, [id, uploadedAssets, updateNodeInternals]);

    // Memoize handlers
    const handleNodeClick = useCallback(() => {
      setSelectedNodeId(id);
    }, [id, setSelectedNodeId]);

    const handleImageClick = useCallback(() => {
      setIsImageDialogOpen(true);
    }, []);

    // Memoize upload states
    const isUploading = useMemo(
      () => nodeData?.isUploading || false,
      [nodeData?.isUploading]
    );

    const uploadedFileName = useMemo(
      () => nodeData?.uploadedFileName as string | undefined,
      [nodeData?.uploadedFileName]
    );

    // Memoize image URL - will be available after upload from imageDetails or previewUrl
    const imageUrl = useMemo(
      () => nodeData?.previewUrl as string | undefined,
      [nodeData?.previewUrl]
    );

    // Handle file selection from input
    const handleFileInputChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
          for (const file of files) {
            const assetId = `${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`;

            // Detect file type from MIME type
            let fileType: "image" | "video" | "audio" = "image";
            if (file.type.startsWith("image/")) {
              fileType = "image";
            } else if (file.type.startsWith("video/")) {
              fileType = "video";
            } else if (file.type.startsWith("audio/")) {
              fileType = "audio";
            }

            const extension = getFileExtension(file.name);
            if (!isValidFileExtension(fileType, extension)) {
              toast.error(
                `Invalid file extension for ${fileType}. Only ${VALID_EXTENSIONS[
                  fileType
                ].join(", ")} are allowed.`
              );
              continue;
            }

            const previewUrl = URL.createObjectURL(file);

            // Extract dimensions based on asset type
            const dimensions = await extractDimensionsFromFile(file, fileType);

            const newAsset = {
              id: assetId,
              type: fileType,
              fileName: file.name,
              previewUrl,
              filePath: "",
              isUploading: true,
              ...(dimensions && {
                width: dimensions.width,
                height: dimensions.height,
              }),
            };

            setUploadedAssets((prev) => [...prev, newAsset]);

            // Handle upload for each file (fire and forget)
            void handleUploadAsset(id, file);
          }
        }
        // Reset input
        if (e.target) {
          e.target.value = "";
        }
      },
      [id]
    );

    // Detect file type from drag event
    const detectFileTypeFromDrag = useCallback(
      (e: React.DragEvent): "image" | "video" | "audio" | null => {
        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
          const item = items[0];
          if (item.kind === "file") {
            const type = item.type;

            // Get filename from the item's getAsString method or use type info
            let fileName = "unknown";
            if (item.getAsString) {
              // This might not work for files, but let's try
              item.getAsString((str) => {
                fileName = str;
              });
            }

            // Fallback: extract extension from MIME type or use a default
            let fileExtension = "unknown";
            if (type) {
              // Try to extract extension from MIME type
              const mimeToExt: Record<string, string> = {
                "image/png": "png",
                "image/jpeg": "jpg",
                "image/jpg": "jpg",
                "image/webp": "webp",
                "image/avif": "avif",
                "image/tiff": "tiff",
                "image/bmp": "bmp",
                "image/jp2": "jp2",
                "video/mp4": "mp4",
                "video/m4v": "m4v",
                "video/quicktime": "mov",
                "video/webm": "webm",
                "audio/mp3": "mp3",
                "audio/mpeg": "mp3",
                "audio/wav": "wav",
                "audio/aac": "aac",
                "audio/aiff": "aiff",
                "audio/flac": "flac",
              };
              fileExtension = mimeToExt[type] || "unknown";
            }

            // Check for image types
            if (type.startsWith("image/")) {
              return "image";
            }
            // Check for video types
            if (type.startsWith("video/")) {
              return "video";
            }
            // Check for audio types
            if (type.startsWith("audio/")) {
              return "audio";
            }
          }
        }
        return null;
      },
      []
    );

    // Handle drag enter (only fires once when entering)
    const handleDragEnter = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);

        // Only detect file type once per drag session
        if (!hasDetectedFileType) {
          const fileType = detectFileTypeFromDrag(e);
          setDragOverFileType(fileType);
          setHasDetectedFileType(true);
        }
      },
      [detectFileTypeFromDrag, hasDetectedFileType]
    );

    // Handle drag over (just prevent default, no state updates)
    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    // Handle drag leave
    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Only reset state if we're actually leaving the drop zone
      // Check if the related target is outside the drop zone
      const dropZone = e.currentTarget;
      const relatedTarget = e.relatedTarget as Node;

      if (!dropZone.contains(relatedTarget)) {
        setIsDragOver(false);
        setDragOverFileType(null);
        setHasDetectedFileType(false);
      }
    }, []);

    // Handle drop
    const handleDrop = useCallback(
      async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        setDragOverFileType(null);
        setHasDetectedFileType(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
          // Add all files to uploaded assets immediately
          for (const file of files) {
            const assetId = `${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`;

            // Detect file type from MIME type
            let fileType: "image" | "video" | "audio" = "image";
            if (file.type.startsWith("image/")) {
              fileType = "image";
            } else if (file.type.startsWith("video/")) {
              fileType = "video";
            } else if (file.type.startsWith("audio/")) {
              fileType = "audio";
            }

            const extension = getFileExtension(file.name);
            if (!isValidFileExtension(fileType, extension)) {
              toast.error(
                `Invalid file extension for ${fileType}. Only ${VALID_EXTENSIONS[
                  fileType
                ].join(", ")} are allowed.`
              );
              continue;
            }

            const previewUrl = URL.createObjectURL(file);

            // Extract dimensions based on asset type
            const dimensions = await extractDimensionsFromFile(file, fileType);

            const newAsset = {
              id: assetId,
              type: fileType,
              fileName: file.name,
              previewUrl,
              filePath: "",
              isUploading: true,
              ...(dimensions && {
                width: dimensions.width,
                height: dimensions.height,
              }),
            };

            setUploadedAssets((prev) => [...prev, newAsset]);

            // Handle upload for each file
            void handleUploadAsset(id, file);
          }
        }
      },
      [id]
    );

    return (
      <>
        <NodeAnimation>
          <motion.div
            className={cn(
              "bg-popover rounded-xl p-4 min-w-[420px] border border-popover cursor-pointer",
              isNodeDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              ...(selected && {
                backgroundColor: "var(--node-selected)",
                borderColor: "var(--node-selected-border)",
              }),
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleNodeClick}
          >
            {/* Upload drop zone */}
            <div
              className="min-h-[200px] rounded-lg border border-dashed border-border bg-[#1F202E] hover:bg-[#1a1b2e] flex items-center justify-center cursor-pointer transition-colors"
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {/* drag box */}
              <div className="flex items-center justify-center flex-col gap-2 mb-2">
                {/* Dynamic icon based on file type */}
                <div className="relative">
                  <div className="rounded-full border border-border p-3 flex items-center justify-center">
                    <AnimatePresence mode="popLayout">
                      <AnimatedIcon
                        fileType={dragOverFileType}
                        isDragOver={isDragOver}
                      />
                    </AnimatePresence>
                  </div>
                </div>

                <span className="text-caption-desktop-regular text-center">
                  Drop your media here or click to browse
                </span>
                {/* supported types */}
                <div className="flex items-center justify-center flex-col gap-2">
                  <span className="text-[10px] text-center text-muted-foreground">
                    Support for multiple file types
                  </span>
                  {/* types */}
                  <TooltipProvider>
                    <div className="flex items-center justify-center gap-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[8px] text-muted-foreground hover:text-white cursor-pointer transition-colors flex items-center gap-1">
                            {FILE_TYPE_INFO.image.displayName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-black/80 border border-border"
                        >
                          {FILE_TYPE_INFO.image.extensions}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[8px] text-muted-foreground hover:text-white cursor-pointer transition-colors">
                            {FILE_TYPE_INFO.video.displayName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-black/80 border border-border"
                        >
                          {FILE_TYPE_INFO.video.extensions}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[8px] text-muted-foreground hover:text-white cursor-pointer transition-colors">
                            {FILE_TYPE_INFO.audio.displayName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-black/80 border border-border"
                        >
                          {FILE_TYPE_INFO.audio.extensions}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Uploaded Assets Container */}
            {uploadedAssets.length > 0 && (
              <div className="mt-4 space-y-2 relative">
                <div className="space-y-2">
                  {uploadedAssets.map((asset, index) => {
                    const cardHeight = 40;
                    const cardGap = 17;
                    const handleTop = 25 + index * (cardHeight + cardGap);

                    const isHandleConnected = edges.some(
                      (edge) =>
                        edge.source === id && edge.sourceHandle === asset.id
                    );

                    return (
                      <React.Fragment key={asset.id}>
                        <MediaAssetCard
                          assetId={asset.id}
                          type={asset.type}
                          fileName={asset.fileName}
                          previewUrl={asset.previewUrl}
                          onSelected={selected}
                          isConnected={isHandleConnected}
                        />
                        {/* Asset Handle - Direct child of node */}
                        <AssetHandle
                          config={{
                            id: asset.id,
                            type: "source",
                            position: "right",
                            dataType: asset.type,
                          }}
                          nodeId={id}
                          positionMode="absolute"
                          onSelected={selected}
                          isConnected={isHandleConnected}
                          top={`${handleTop}px`}
                          offset="-15px"
                        />
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/tiff,image/bmp,image/jp2,video/mp4,video/m4v,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/aac,audio/aiff,audio/flac"
              onChange={handleFileInputChange}
              className="hidden"
              multiple
            />
          </motion.div>
        </NodeAnimation>

        {/* Image Dialog */}
        <ImageDialog
          isOpen={isImageDialogOpen}
          imageUrl={imageUrl}
          onClose={() => setIsImageDialogOpen(false)}
        />
      </>
    );
  }
);

UploadNode.displayName = "UploadNode";

export default UploadNode;
