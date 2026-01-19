"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SearchIcon } from "@/constants/icons";
import { Kbd } from "@/components/ui/kbd";
import { useReactFlow } from "@xyflow/react";
import useFlowStore from "../../../stores/canvas-store";
import { useIsWalkthroughActive } from "../../../stores/walkthrough-store";
import {
  getAllAvailableNodes,
  getCompatibleNodes,
  getCompatibleSourceNodes,
  type ConnectionMenuItem,
} from "../../../constants/connections/connection-menu-utils";

type ConnectionMenuProps = {
  className?: string;
};

const ConnectionMenu: React.FC<ConnectionMenuProps> = ({ className }) => {
  const connectionMenuOpen = useFlowStore((state) => state.connectionMenuOpen);
  const setConnectionMenuOpen = useFlowStore(
    (state) => state.setConnectionMenuOpen
  );
  const connectionSourceInfo = useFlowStore(
    (state) => state.connectionSourceInfo
  );
  const connectionMenuPosition = useFlowStore(
    (state) => state.connectionMenuPosition
  );
  const addNode = useFlowStore((state) => state.addNode);
  const addNodeAtPositionAndConnect = useFlowStore(
    (state) => state.addNodeAtPositionAndConnect
  );
  const addNodeAtPositionAndConnectToTarget = useFlowStore(
    (state) => state.addNodeAtPositionAndConnectToTarget
  );
  const setConnectionMenuPosition = useFlowStore(
    (state) => state.setConnectionMenuPosition
  );
  const setConnectionSourceInfo = useFlowStore(
    (state) => state.setConnectionSourceInfo
  );
  const rfInstance = useFlowStore((state) => state.rfInstance);
  const { screenToFlowPosition } = useReactFlow();
  const isWalkthroughActive = useIsWalkthroughActive();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuOpenedAtRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use a ref to store cursor position (no re-renders)
  const cursorPositionRef = useRef<{ x: number; y: number } | null>(null);
  // Local state for menu position (only updated when opening via Cmd+K)
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Compute menu items based on how menu was opened
  const menuItems = useMemo<ConnectionMenuItem[]>(() => {
    if (!connectionMenuOpen) {
      return [];
    }

    // If opened from connection line, show only compatible nodes
    if (
      connectionSourceInfo.handleType === "source" &&
      connectionSourceInfo.sourceNodeId
    ) {
      return getCompatibleNodes(
        connectionSourceInfo.sourceNodeId,
        connectionSourceInfo.sourceHandleId
      );
    }

    if (
      connectionSourceInfo.handleType === "target" &&
      connectionSourceInfo.targetNodeId
    ) {
      return getCompatibleSourceNodes(
        connectionSourceInfo.targetNodeId,
        connectionSourceInfo.targetHandleId
      );
    }

    // Otherwise (Cmd+K), show all available nodes
    return getAllAvailableNodes();
  }, [
    connectionMenuOpen,
    connectionSourceInfo.handleType,
    connectionSourceInfo.sourceNodeId,
    connectionSourceInfo.sourceHandleId,
    connectionSourceInfo.targetNodeId,
    connectionSourceInfo.targetHandleId,
  ]);

  // Determine if menu was opened from connection line
  const isConnectionMode =
    connectionSourceInfo.sourceNodeId !== null ||
    connectionSourceInfo.targetNodeId !== null;

  // Track mouse position in a ref (no state updates, no re-renders)
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      cursorPositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle Cmd+K keyboard shortcut - capture position right before opening
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent opening connection menu during walkthrough
      if (isWalkthroughActive) {
        return;
      }

      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();

        if (!connectionMenuOpen) {
          // Clear any existing connection menu position and source info from store
          // This ensures Cmd+K uses local menuPosition and shows all nodes
          useFlowStore.getState().setConnectionMenuPosition(null);
          useFlowStore.getState().setConnectionSourceInfo({
            sourceNodeId: null,
            sourceHandleId: null,
            targetNodeId: null,
            targetHandleId: null,
            handleType: null,
          });

          // Capture cursor position from ref before opening (most recent position)
          // This is performant - no mouse tracking state updates, just reading from ref
          if (cursorPositionRef.current) {
            setMenuPosition(cursorPositionRef.current);
          }
        }

        setConnectionMenuOpen(!connectionMenuOpen);
      }
      // Close on Escape
      if (event.key === "Escape" && connectionMenuOpen) {
        setConnectionMenuOpen(false);
        setMenuPosition(null);
        // Also clear connection menu position and source info from store
        useFlowStore.getState().setConnectionMenuPosition(null);
        useFlowStore.getState().setConnectionSourceInfo({
          sourceNodeId: null,
          sourceHandleId: null,
          targetNodeId: null,
          targetHandleId: null,
          handleType: null,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [connectionMenuOpen, setConnectionMenuOpen, isWalkthroughActive]);

  // Track when menu opens
  useEffect(() => {
    if (connectionMenuOpen) {
      menuOpenedAtRef.current = Date.now();
    } else {
      menuOpenedAtRef.current = null;
    }
  }, [connectionMenuOpen]);

  // Auto-focus input when menu opens
  useEffect(() => {
    if (connectionMenuOpen && !isWalkthroughActive) {
      // Small delay to ensure menu is fully rendered and animated
      // Match the delay used for click-outside listener
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 150); // Slightly longer than click-outside delay to account for animation

      return () => clearTimeout(timeoutId);
    }
  }, [connectionMenuOpen, isWalkthroughActive]);

  // Close menu when clicking outside
  // Only attach listener after menu has been open for a bit to avoid immediate closure
  useEffect(() => {
    if (!connectionMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      // Don't close if menu was just opened (within 200ms)
      const timeSinceOpened = menuOpenedAtRef.current
        ? Date.now() - menuOpenedAtRef.current
        : Infinity;

      if (timeSinceOpened < 200) {
        return;
      }

      // Check if click is outside the menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        setConnectionMenuOpen(false);
        setMenuPosition(null);
        // Also clear connection menu position and source info from store
        useFlowStore.getState().setConnectionMenuPosition(null);
        useFlowStore.getState().setConnectionSourceInfo({
          sourceNodeId: null,
          sourceHandleId: null,
          targetNodeId: null,
          targetHandleId: null,
          handleType: null,
        });
      }
    };

    // Wait for menu to be fully rendered before attaching click-outside listener
    // This prevents the connection drag release event from immediately closing the menu
    const timeoutId = setTimeout(() => {
      // Use capture phase to catch events before they're stopped by React Flow
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 100); // Small delay to let menu render

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [connectionMenuOpen, setConnectionMenuOpen]);

  // Extract node creation logic into a reusable function
  const handleNodeCreation = React.useCallback(
    (node: ConnectionMenuItem) => {
      // Close menu first
      setConnectionMenuOpen(false);

      // Determine position - prefer connection menu position, then menuPosition (from Cmd+K), fallback to center
      let flowPosition: { x: number; y: number };

      // Use connectionMenuPosition if available (from connection line), otherwise use menuPosition (from Cmd+K)
      const positionToUse = connectionMenuPosition || menuPosition;

      if (positionToUse) {
        // Convert screen coordinates to flow coordinates
        if (rfInstance) {
          flowPosition = rfInstance.screenToFlowPosition({
            x: positionToUse.x,
            y: positionToUse.y,
          });
        } else if (screenToFlowPosition) {
          flowPosition = screenToFlowPosition({
            x: positionToUse.x,
            y: positionToUse.y,
          });
        } else {
          // Fallback: use a default offset position
          flowPosition = { x: 300, y: 300 };
        }
      } else {
        // Fallback: use a default position
        flowPosition = { x: 300, y: 300 };
      }

      // If opened from connection line, connect appropriately
      if (
        connectionSourceInfo.handleType === "source" &&
        connectionSourceInfo.sourceNodeId
      ) {
        // Connecting from source handle - add node and connect to source
        addNodeAtPositionAndConnect(
          node.nodeType,
          flowPosition,
          connectionSourceInfo.sourceNodeId,
          connectionSourceInfo.sourceHandleId
        );
      } else if (
        connectionSourceInfo.handleType === "target" &&
        connectionSourceInfo.targetNodeId
      ) {
        // Connecting from target handle - add node and connect to target
        addNodeAtPositionAndConnectToTarget(
          node.nodeType,
          flowPosition,
          connectionSourceInfo.targetNodeId,
          connectionSourceInfo.targetHandleId
        );
      } else {
        // If opened via Cmd+K, just add node without connection
        addNode(node.nodeType, flowPosition);
      }

      // Clear connection info and position
      setConnectionSourceInfo({
        sourceNodeId: null,
        sourceHandleId: null,
        targetNodeId: null,
        targetHandleId: null,
        handleType: null,
      });
      setConnectionMenuPosition(null);
      setMenuPosition(null);
    },
    [
      setConnectionMenuOpen,
      connectionMenuPosition,
      menuPosition,
      rfInstance,
      screenToFlowPosition,
      connectionSourceInfo,
      addNodeAtPositionAndConnect,
      addNodeAtPositionAndConnectToTarget,
      addNode,
      setConnectionSourceInfo,
      setConnectionMenuPosition,
    ]
  );

  // Handle Enter key press on input
  const handleInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && menuItems.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        // Find the currently selected/highlighted item in the DOM
        // Command component uses [cmdk-item] with [data-selected="true"] or aria-selected
        const selectedItem = menuRef.current?.querySelector(
          '[cmdk-item][data-selected="true"], [cmdk-item][aria-selected="true"], [cmdk-item].selected'
        ) as HTMLElement | null;

        if (selectedItem) {
          // Get the value attribute from the selected item (Command.Item uses value prop)
          const itemValue =
            selectedItem.getAttribute("data-value") ||
            selectedItem.getAttribute("value") ||
            selectedItem.textContent?.trim();

          if (itemValue) {
            // Find the matching node in menuItems by comparing the value
            const matchingNode = menuItems.find(
              (node) =>
                `${node.title} ${node.nodeType}` === itemValue ||
                node.title.toLowerCase().includes(itemValue.toLowerCase())
            );
            if (matchingNode) {
              handleNodeCreation(matchingNode);
              return;
            }
          }
          // If we can't find by value, trigger click as fallback
          selectedItem.click();
        } else {
          // If no item is selected, use the first item
          // This handles the case when menu opens via Cmd+K and no item is highlighted yet
          const firstItem = menuItems[0];
          if (firstItem) {
            handleNodeCreation(firstItem);
          }
        }
      }
    },
    [menuItems, handleNodeCreation]
  );

  // Determine which position to use (connection line position takes priority)
  const effectivePosition = connectionMenuPosition || menuPosition;

  return (
    <AnimatePresence mode="wait">
      {connectionMenuOpen && !isWalkthroughActive && (
        <motion.div
          ref={menuRef}
          className={cn(
            "fixed z-50 pointer-events-auto",
            "bg-popover border border-border rounded-lg shadow-lg w-[280px]",
            "overflow-hidden",
            className
          )}
          style={
            effectivePosition
              ? {
                  left: `${effectivePosition.x + 8}px`,
                  top: `${effectivePosition.y + 8}px`,
                  transform: "none",
                }
              : {
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }
          }
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 0.5,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Command
            className="[&_[cmdk-root]]:bg-transparent [&_[cmdk-list]]:bg-transparent "
            label="Connection Menu"
          >
            <div className="relative group border-b border-border py-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <Image
                  src={SearchIcon}
                  alt="Search"
                  width={16}
                  height={20}
                  className="w-3 h-3 transition-all duration-200 group-focus-within:brightness-0 group-focus-within:invert"
                />
              </div>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center gap-0.5">
                <Kbd className="h-3 min-w-3 text-[7px] rounded-[3px] px-0.5 bg-muted border border-border">
                  ⌘
                </Kbd>
                <Kbd className="h-3 min-w-3 text-[7px] rounded-[3px] px-0.5 bg-muted border border-border">
                  K
                </Kbd>
              </div>
              <Command.Input
                ref={inputRef}
                placeholder="Search"
                className="w-full h-8 pl-9 pr-16 text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground text-foreground focus:ring-0"
                onKeyDown={handleInputKeyDown}
              />
            </div>
            <Command.List className="max-h-[240px] overflow-y-auto p-1.5 connection-menu-scrollbar">
              <Command.Empty className="px-2 py-3 text-xs text-center text-muted-foreground">
                {isConnectionMode
                  ? "No compatible nodes found."
                  : "No nodes found."}
              </Command.Empty>
              <Command.Group>
                {menuItems.map((node) => (
                  <Command.Item
                    key={node.nodeType}
                    value={`${node.title} ${node.nodeType}`}
                    onSelect={() => handleNodeCreation(node)}
                    className="group flex items-center justify-between px-2 py-2 rounded-sm cursor-pointer text-xs transition-colors text-muted-foreground hover:bg-muted/50 data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={node.icon}
                        alt={node.title}
                        width={12}
                        height={12}
                        className="flex-shrink-0 opacity-60 transition-all group-data-[selected=true]:brightness-0 group-data-[selected=true]:invert group-data-[selected=true]:opacity-100"
                      />
                      <span className="text-caption-desktop-regular">
                        {node.title}
                      </span>
                    </div>
                    {/* keyboard */}
                    <Kbd className="h-3 min-w-3 text-[7px] rounded-[3px] px-0.5 bg-accent border border-border">
                      ⏎
                    </Kbd>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionMenu;
