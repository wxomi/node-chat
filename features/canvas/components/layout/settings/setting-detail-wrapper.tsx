"use client";

import React, { useCallback, useMemo } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Minimize2Icon } from "lucide-react";
import useConfigStore from "../../../stores/config-store";
import useFlowStore from "../../../stores/canvas-store";
import { getNodeDisplayName, getNodeIcon } from "../../../lib/shared";
import {
  AIImageUpscalerSettings,
  FaceSwapImageSettings,
  LipSyncSettings,
  VideoGeneratorSettings,
} from "../../settings";

type SettingDetailWrapperProps = {
  nodeId: string;
};

const SettingDetailWrapper: React.FC<SettingDetailWrapperProps> = ({
  nodeId,
}) => {
  // Get node type from store
  const nodeType = useFlowStore(
    useCallback(
      (state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        return node?.type;
      },
      [nodeId]
    )
  );

  const selectedNodeId = useConfigStore((state) => state.selectedNodeId);
  const reactFlowSelectedNodeId = useFlowStore(
    useCallback((state) => state.nodes.find((n) => n.selected)?.id ?? null, [])
  );
  // Keep panel aligned with React Flow selection when present, and fallback to UI
  // selection when React Flow temporarily clears selected flags (portal interactions).
  const isNodeSelected = useMemo(() => {
    if (reactFlowSelectedNodeId) {
      return reactFlowSelectedNodeId === nodeId;
    }
    return selectedNodeId === nodeId;
  }, [nodeId, reactFlowSelectedNodeId, selectedNodeId]);

  // Optimize subscription - only re-render when THIS node's panel state changes
  const isMaximizedRaw = useConfigStore(
    useCallback((state) => state.settingsNodeId === nodeId, [nodeId])
  );

  // Panel is maximized only if: settingsNodeId matches AND node is actually selected
  // This prevents flicker when node is deselected
  const isMaximized = useMemo(
    () => isMaximizedRaw && isNodeSelected,
    [isMaximizedRaw, isNodeSelected]
  );

  // Get node display name and icon
  const nodeDisplayName = useMemo(
    () => getNodeDisplayName(nodeType),
    [nodeType]
  );

  const nodeIcon = useMemo(() => getNodeIcon(nodeType), [nodeType]);

  // Memoize toggle click handler
  const handleToggleClick = useCallback(() => {
    const store = useConfigStore.getState();
    store.setSettingsNodeId(isMaximized ? null : nodeId);
  }, [isMaximized, nodeId]);

  // Memoize minimize click handler
  const handleMinimizeClick = useCallback(() => {
    useConfigStore.getState().setSettingsNodeId(null);
  }, []);

  // Router: render appropriate settings component based on node type
  const renderSettingsContent = () => {
    if (!nodeType) return null;

    switch (nodeType) {
      case "ai-image-upscaler-node-prototype":
        return <AIImageUpscalerSettings nodeId={nodeId} />;
      case "face-swap-node-prototype":
        return <FaceSwapImageSettings nodeId={nodeId} />;
      case "video-generator-node-prototype":
        return <VideoGeneratorSettings nodeId={nodeId} />;
      case "lip-sync-node-prototype":
        return <LipSyncSettings nodeId={nodeId} />;
      default:
        return null;
    }
  };

  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        {!isMaximized && isNodeSelected && (
          <motion.div
            data-settings-panel="true"
            key={`settings-wrapper-${nodeDisplayName}`}
            layoutId="settings-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleToggleClick}
            style={{
              borderRadius: "6px",
            }}
            className={cn(
              "px-3 flex bg-sidebar-background cursor-pointer w-fit py-1.5 border border-border relative overflow-hidden"
            )}
          >
            {/* Node header title - button settings */}
            <motion.div layoutId="settings-icon-title-wrapper">
              <AnimatePresence mode="wait">
                <motion.div
                  className="flex items-center justify-center gap-2"
                  key={nodeDisplayName}
                  initial={{ y: 20, filter: "blur(5px)" }}
                  animate={{ y: 0, filter: "blur(0px)" }}
                  transition={{
                    type: "spring",
                    duration: 0.3,
                    bounce: 0,
                  }}
                >
                  <Image
                    src={nodeIcon}
                    alt="Settings"
                    width={12}
                    height={12}
                    style={{
                      filter:
                        "brightness(0) saturate(100%) invert(45%) sepia(100%) saturate(2000%) hue-rotate(250deg) brightness(0.85)",
                    }}
                  />
                  {/* Display settings text */}
                  <motion.span className="text-caption-desktop-regular text-secondary-foreground whitespace-nowrap">
                    {nodeDisplayName}
                  </motion.span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {isMaximized && isNodeSelected && (
          <motion.div
            data-settings-panel="true"
            layoutId="settings-wrapper"
            style={{
              borderRadius: "8px",
            }}
            className="bg-sidebar-background w-[320px] h-fit border border-node-selected-border flex items-start justify-start absolute top-0 right-0 py-3 flex-col ring-1 ring-offset-3 ring-offset-muted ring-border"
          >
            {/* Node header title - button settings  */}
            <div className="flex items-center justify-between w-full border-b border-border pb-4 px-4">
              <motion.div layoutId="settings-icon-title-wrapper">
                <AnimatePresence mode="wait">
                  <motion.div
                    className="flex items-center justify-center gap-2"
                    key={nodeDisplayName}
                    initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      type: "spring",
                      duration: 0.3,
                      bounce: 0,
                    }}
                  >
                    <Image
                      src={nodeIcon}
                      alt="Settings"
                      width={12}
                      height={12}
                      style={{
                        filter:
                          "brightness(0) saturate(100%) invert(45%) sepia(100%) saturate(2000%) hue-rotate(250deg) brightness(0.85)",
                      }}
                    />
                    {/* Display settings text */}
                    <motion.span className="text-caption-desktop-regular text-secondary-foreground whitespace-nowrap">
                      {nodeDisplayName}
                    </motion.span>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* minimise button */}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.button
                  initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                  transition={{
                    type: "spring",
                    duration: 0.3,
                    bounce: 0,
                  }}
                  onClick={handleMinimizeClick}
                  className="group cursor-pointer"
                >
                  <Minimize2Icon className="size-3 group-hover:text-white text-muted-foreground" />
                </motion.button>
              </AnimatePresence>
            </div>

            {/* panel content */}
            <motion.div
              key={`panel-content-${nodeId}`}
              className="w-full flex flex-col mt-6"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.1,
                  },
                },
              }}
            >
              {renderSettingsContent()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(SettingDetailWrapper);
