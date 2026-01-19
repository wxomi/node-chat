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
import CustomHandle from "../../shared/connections/custom-handle";
import { NodeAnimation } from "@/lib/animations/node-animation";
import { handleSingleUploadAsset } from "../../../handlers/upload";
import Image from "next/image";
import { ImportIcon } from "lucide-react";
import { toast } from "sonner";
import {
  VALID_EXTENSIONS,
  FILE_TYPE_INFO,
} from "../../../constants/upload/upload-constants";
import {
  getFileExtension,
  isValidFileExtension,
  getIconConfig,
  detectAssetTypeFromMime,
} from "../../../lib/upload";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";
import MediaAssetCard from "../../shared/assets/media-asset-card";

type SingleUploadNodeProps = {
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

const SingleUploadNode: React.FC<SingleUploadNodeProps> = memo(
  ({ id, selected, dragging }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragOverFileType, setDragOverFileType] = useState<
      "image" | "video" | "audio" | null
    >(null);
    const [hasDetectedFileType, setHasDetectedFileType] = useState(false);
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

    // Memoize expected dataType from ghost node context (image, video, or audio)
    const expectedDataType = useMemo(
      () =>
        (nodeData?.expectedDataType as
          | "image"
          | "video"
          | "audio"
          | "string"
          | null) || null,
      [nodeData?.expectedDataType]
    );

    // Memoize asset state (from uploaded file)
    const assetType = useMemo(
      () => (nodeData?.assetType as "image" | "video" | "audio" | null) || null,
      [nodeData?.assetType]
    );

    // Determine handle dataType: uploaded asset takes priority, then expected type, default to string
    const handleDataType = useMemo(() => {
      if (assetType) return assetType;
      if (expectedDataType && expectedDataType !== "string")
        return expectedDataType;
      return "string";
    }, [assetType, expectedDataType]);

    // Update flowConfig output dataType when handleDataType changes
    useEffect(() => {
      if (
        !flowConfig?.outputs?.[0] ||
        flowConfig.outputs[0].id !== "asset-output"
      ) {
        return;
      }

      if (flowConfig.outputs[0].dataType !== handleDataType) {
        useFlowStore.getState().updateNodeData(id, {
          flowConfig: {
            ...flowConfig,
            outputs: [
              {
                ...flowConfig.outputs[0],
                dataType: handleDataType,
              },
            ],
          },
        });
      }
    }, [id, handleDataType, flowConfig]);

    const fileName = useMemo(
      () => (nodeData?.fileName as string | undefined) || null,
      [nodeData?.fileName]
    );

    const previewUrl = useMemo(
      () => (nodeData?.previewUrl as string | undefined) || null,
      [nodeData?.previewUrl]
    );

    // Memoize handlers
    const handleNodeClick = useCallback(() => {
      setSelectedNodeId(id);
    }, [id, setSelectedNodeId]);

    // Check if handle is connected
    const isHandleConnected = useMemo(
      () =>
        edges.some(
          (edge) => edge.source === id && edge.sourceHandle === "asset-output"
        ),
      [edges, id]
    );

    // Get accept attribute for file input based on expectedDataType
    const getAcceptAttribute = useMemo(() => {
      const assetDataTypes = ["image", "video", "audio"] as const;
      const allowedTypes: readonly ("image" | "video" | "audio")[] =
        expectedDataType &&
        assetDataTypes.includes(expectedDataType as "image" | "video" | "audio")
          ? [expectedDataType as "image" | "video" | "audio"]
          : (["image", "video", "audio"] as const);

      const acceptTypes: string[] = [];

      if (allowedTypes.includes("image")) {
        acceptTypes.push(
          "image/png,image/jpeg,image/webp,image/avif,image/tiff,image/bmp,image/jp2"
        );
      }
      if (allowedTypes.includes("video")) {
        acceptTypes.push("video/mp4,video/m4v,video/quicktime,video/webm");
      }
      if (allowedTypes.includes("audio")) {
        acceptTypes.push(
          "audio/mpeg,audio/wav,audio/aac,audio/aiff,audio/flac"
        );
      }

      return acceptTypes.join(",");
    }, [expectedDataType]);

    // Handle file selection from input
    const handleFileInputChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
          const file = files[0]; // Only take first file

          // Detect file type from MIME type
          const fileType = detectAssetTypeFromMime(file.type);

          // If expectedDataType is set, validate against it
          if (expectedDataType && expectedDataType !== "string") {
            if (fileType !== expectedDataType) {
              toast.error(
                `Expected ${expectedDataType} file, but received ${fileType}. Please upload a ${expectedDataType} file.`
              );
              return;
            }
          }

          const extension = getFileExtension(file.name);
          if (!isValidFileExtension(fileType, extension)) {
            toast.error(
              `Invalid file extension for ${fileType}. Only ${VALID_EXTENSIONS[
                fileType
              ].join(", ")} are allowed.`
            );
            return;
          }

          // Handle upload (replaces existing asset)
          // Handler will extract dimensions and update orientation
          void handleSingleUploadAsset(id, file);
        }
        // Reset input
        if (e.target) {
          e.target.value = "";
        }
      },
      [id, expectedDataType]
    );

    // Detect file type from drag event
    const detectFileTypeFromDrag = useCallback(
      (e: React.DragEvent): "image" | "video" | "audio" | null => {
        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
          const item = items[0];
          if (item.kind === "file") {
            const type = item.type;
            if (type.startsWith("image/")) return "image";
            if (type.startsWith("video/")) return "video";
            if (type.startsWith("audio/")) return "audio";
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
          const file = files[0]; // Only take first file

          // Detect file type from MIME type
          const fileType = detectAssetTypeFromMime(file.type);

          // If expectedDataType is set, validate against it
          if (expectedDataType && expectedDataType !== "string") {
            if (fileType !== expectedDataType) {
              toast.error(
                `Expected ${expectedDataType} file, but received ${fileType}. Please upload a ${expectedDataType} file.`
              );
              return;
            }
          }

          const extension = getFileExtension(file.name);
          if (!isValidFileExtension(fileType, extension)) {
            toast.error(
              `Invalid file extension for ${fileType}. Only ${VALID_EXTENSIONS[
                fileType
              ].join(", ")} are allowed.`
            );
            return;
          }

          // Handle upload (replaces existing asset)
          // Handler will extract dimensions and update orientation
          void handleSingleUploadAsset(id, file);
        }
      },
      [id, expectedDataType]
    );

    // Determine handle backgroundColor
    // Use chart color if we have asset type info, otherwise use muted for string/unknown
    const handleBackgroundColor = useMemo(() => {
      const assetDataTypes = ["image", "video", "audio"];
      const hasAssetTypeInfo =
        assetType ||
        (expectedDataType && assetDataTypes.includes(expectedDataType));

      // Return undefined to let CustomHandle use chart color, or muted for string/unknown
      return hasAssetTypeInfo ? undefined : "hsl(var(--muted-foreground))";
    }, [assetType, expectedDataType]);

    // Determine display type: use assetType if uploaded, otherwise expectedDataType
    const displayType = useMemo(() => {
      if (assetType) return assetType;
      if (expectedDataType && expectedDataType !== "string")
        return expectedDataType;
      return null; // No specific type, show all options
    }, [assetType, expectedDataType]);

    // Get display text based on display type
    const displayText = useMemo(() => {
      if (assetType) {
        return `Replace ${assetType}`;
      }
      if (displayType) {
        return `Drop your ${displayType} here or click to browse`;
      }
      return "Drop your media here or click to browse";
    }, [assetType, displayType]);

    return (
      <>
        <NodeAnimation>
          <motion.div
            className={cn(
              "bg-popover rounded-xl p-4 min-w-[420px] border border-popover cursor-pointer relative",
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
              className={cn(
                "min-h-[200px] rounded-lg border border-dashed border-border bg-[#1F202E] hover:bg-[#1a1b2e] flex items-center justify-center cursor-pointer transition-colors relative"
              )}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={(e) => {
                fileInputRef.current?.click();
              }}
            >
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
                  {displayText}
                </span>

                {/* supported types */}
                {!assetType && (
                  <div className="flex items-center justify-center flex-col gap-2">
                    {displayType ? (
                      // Show only the specific type's extensions
                      <span className="text-[10px] text-center text-muted-foreground">
                        {FILE_TYPE_INFO[displayType].extensions}
                      </span>
                    ) : (
                      // Show all types when no specific type is expected
                      <>
                        <span className="text-[10px] text-center text-muted-foreground">
                          Support for multiple file types
                        </span>
                        <div className="flex items-center justify-center gap-4">
                          <span className="text-[8px] text-muted-foreground">
                            {FILE_TYPE_INFO.image.displayName}:{" "}
                            {FILE_TYPE_INFO.image.extensions}
                          </span>
                          <span className="text-[8px] text-muted-foreground">
                            {FILE_TYPE_INFO.video.displayName}:{" "}
                            {FILE_TYPE_INFO.video.extensions}
                          </span>
                          <span className="text-[8px] text-muted-foreground">
                            {FILE_TYPE_INFO.audio.displayName}:{" "}
                            {FILE_TYPE_INFO.audio.extensions}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Asset Container */}
            {previewUrl && assetType && fileName && (
              <div className="mt-4 space-y-2 relative">
                <div className="space-y-2">
                  <MediaAssetCard
                    assetId="asset-output"
                    type={assetType}
                    fileName={fileName}
                    previewUrl={previewUrl}
                    onSelected={selected}
                    isConnected={isHandleConnected}
                  />
                </div>
              </div>
            )}

            {/* Single centered handle on right side */}
            <CustomHandle
              config={{
                id: "asset-output",
                type: "source",
                position: "right",
                dataType: handleDataType,
              }}
              nodeId={id}
              onSelected={selected}
              isConnected={isHandleConnected}
              isHovered={isHovered}
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                right: "-15px",
              }}
              backgroundColor={handleBackgroundColor}
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptAttribute}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </motion.div>
        </NodeAnimation>
      </>
    );
  }
);

SingleUploadNode.displayName = "SingleUploadNode";

export default SingleUploadNode;
