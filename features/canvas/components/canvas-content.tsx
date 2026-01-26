"use client";

import {
  Background,
  ReactFlow,
  useReactFlow,
  BackgroundVariant,
  Controls,
  Connection,
  OnConnectStart,
  OnConnectEnd,
  Node,
} from "@xyflow/react";
import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import useFlowStore from "../stores/canvas-store";
import useConfigStore from "../stores/config-store";
import useClipboardStore from "../stores/clipboard-store";
import {
  performCanvasLoad,
  restoreCanvas,
  handleCanvasFileDrop,
} from "../lib/canvas";
import {
  detectImageGeneratorNodeDrop,
  shouldDisableFitView,
  validateWalkthroughStep5Connection,
} from "../lib/walkthrough";
import "@xyflow/react/dist/style.css";
import { nodeTypes, edgeTypes } from "../types/canvas-node-types";
import CustomConnectionLine from "./shared/connections/custom-connection-line";
import {
  TaskDetailsPanel,
  TaskPanel,
  NamePanel,
  ConnectionMenu,
} from "./layout";
import {
  CircleOverlay,
  checkCircleCollision,
  PurpleCircles,
  WalkthroughPromptNode,
  RectangleOverlay,
  checkRectangleCoverage,
  CanvasOverlay,
  DropZone,
  HandleHighlight,
  WalkthroughGenerateButton,
  WalkthroughSuggestions,
} from "./walkthrough";
import {
  useIsStepActive,
  useCurrentStep,
  useIsWalkthroughActive,
  useIsStepCompleted,
} from "../stores/walkthrough-store";
import useWalkthroughStore from "../stores/walkthrough-store";
import useCanvasMetadataStore from "../stores/canvas-metadata-store";
import {
  useCanvasLoadingStore,
  useIsCanvasReady,
} from "../stores/canvas-loading-store";
import { CanvasLoadingScreen } from "./loading/canvas/canvas-loading-screen";

type CanvasContentProps = {
  canvasId: string | null;
};

const CanvasContent: React.FC<CanvasContentProps> = ({ canvasId }) => {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const rfInstance = useFlowStore((state) => state.rfInstance);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);
  const onReconnect = useFlowStore((state) => state.onReconnect);
  const addNode = useFlowStore((state) => state.addNode);
  const setRfInstance = useFlowStore((state) => state.setRfInstance);
  const setSelectedNodeId = useConfigStore((state) => state.setSelectedNodeId);
  const copySelectedNodes = useClipboardStore(
    (state) => state.copySelectedNodes
  );
  const pasteNodes = useClipboardStore((state) => state.pasteNodes);
  const undo = useClipboardStore((state) => state.undo);
  const redo = useClipboardStore((state) => state.redo);
  const deleteNode = useFlowStore((state) => state.deleteNode);

  const setConnectionMenuOpen = useFlowStore(
    (state) => state.setConnectionMenuOpen
  );
  const setConnectionMenuPosition = useFlowStore(
    (state) => state.setConnectionMenuPosition
  );
  const setConnectionSourceInfo = useFlowStore(
    (state) => state.setConnectionSourceInfo
  );
  const setReconnectingEdgeId = useFlowStore(
    (state) => state.setReconnectingEdgeId
  );
  const selectNode = useFlowStore((state) => state.selectNode);
  const settingsNodeId = useConfigStore((state) => state.settingsNodeId);
  const setSettingsNodeId = useConfigStore((state) => state.setSettingsNodeId);

  const { screenToFlowPosition } = useReactFlow();
  const currentStep = useCurrentStep();
  const isWalkthroughActive = useIsWalkthroughActive();
  const isStep1Active = useIsStepActive(1);
  const isStep2Active = useIsStepActive(2);
  const isStep3Active = useIsStepActive(3);
  const isStep4Active = useIsStepActive(4);
  const isStep5Active = useIsStepActive(5);
  const isStep6Active = useIsStepActive(6);
  const isStep7Active = useIsStepActive(7);
  const isStep8Completed = useIsStepCompleted(8);

  // Disable fitView when walkthrough steps are active (prevents unwanted zoom)
  // Also disable fitView if step 8 is completed to preserve camera position
  const hasWalkthroughNodes = useMemo(
    () =>
      shouldDisableFitView(
        isWalkthroughActive,
        currentStep,
        nodes,
        isStep8Completed
      ),
    [isWalkthroughActive, currentStep, nodes, isStep8Completed]
  );

  const connectionStartRef = useRef<{
    nodeId: string | null;
    handleId: string | null;
    handleType: "source" | "target" | null;
  } | null>(null);

  // Cursor position tracking for paste (using ref to avoid re-renders)
  const cursorPositionRef = useRef<{ x: number; y: number } | null>(null);

  const onConnectStart: OnConnectStart = useCallback(
    (event, { nodeId, handleId, handleType }) => {
      connectionStartRef.current = {
        nodeId: nodeId || null,
        handleId: handleId || null,
        handleType: handleType || null,
      };

      if (handleType === "source") {
        setConnectionSourceInfo({
          sourceNodeId: nodeId || null,
          sourceHandleId: handleId || null,
          targetNodeId: null,
          targetHandleId: null,
          handleType: "source",
        });
      } else if (handleType === "target") {
        setConnectionSourceInfo({
          sourceNodeId: null,
          sourceHandleId: null,
          targetNodeId: nodeId || null,
          targetHandleId: handleId || null,
          handleType: "target",
        });
      }
    },
    [setConnectionSourceInfo]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      connectionStartRef.current = null;
      setConnectionSourceInfo({
        sourceNodeId: null,
        sourceHandleId: null,
        targetNodeId: null,
        targetHandleId: null,
        handleType: null,
      });
      onConnect(connection);
    },
    [onConnect, setConnectionSourceInfo]
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      // Prevent connection menu from opening during walkthrough
      // isWalkthroughActive = walkthrough is showing
      if (isWalkthroughActive) {
        return;
      }

      const currentReconnectingEdgeId =
        useFlowStore.getState().reconnectingEdgeId;

      if (currentReconnectingEdgeId) {
        setReconnectingEdgeId(null);
        setConnectionSourceInfo({
          sourceNodeId: null,
          sourceHandleId: null,
          targetNodeId: null,
          targetHandleId: null,
          handleType: null,
        });
        connectionStartRef.current = null;
        return;
      }

      let wasConnectionMade = false;

      if (connectionStartRef.current?.handleType === "source") {
        wasConnectionMade =
          connectionState &&
          "target" in connectionState &&
          connectionState.target !== null &&
          connectionState.target !== undefined;
      } else if (connectionStartRef.current?.handleType === "target") {
        wasConnectionMade =
          connectionState &&
          "source" in connectionState &&
          connectionState.source !== null &&
          connectionState.source !== undefined;
      }

      if (connectionStartRef.current && !wasConnectionMade) {
        let clientX = 0;
        let clientY = 0;

        if (event instanceof MouseEvent) {
          clientX = event.clientX;
          clientY = event.clientY;
        } else if (event instanceof TouchEvent && event.touches?.[0]) {
          clientX = event.touches[0].clientX;
          clientY = event.touches[0].clientY;
        }

        if (clientX > 0 && clientY > 0) {
          setConnectionMenuPosition({ x: clientX, y: clientY });
        }
        setConnectionMenuOpen(true);
      } else {
        setConnectionSourceInfo({
          sourceNodeId: null,
          sourceHandleId: null,
          targetNodeId: null,
          targetHandleId: null,
          handleType: null,
        });
      }

      connectionStartRef.current = null;
    },
    [
      setReconnectingEdgeId,
      setConnectionMenuOpen,
      setConnectionMenuPosition,
      setConnectionSourceInfo,
      isWalkthroughActive,
    ]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      // Check if this is a prompt-node-drag (grip handle drag from image-generator-drag)
      const promptDragData = event.dataTransfer.getData(
        "application/prompt-node-drag"
      );

      if (promptDragData) {
        try {
          const { nodeId, prompt } = JSON.parse(promptDragData);

          // Check if drop is on canvas (not outside)
          const target = event.target as HTMLElement;
          const isCanvasDrop =
            target.closest(".react-flow") ||
            target.closest(".react-flow__viewport");

          if (!isCanvasDrop) {
            // Drop outside canvas - cancel
            return;
          }

          // Convert drop position to flow coordinates
          const cursorPosition = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });

          // Default dimensions for text-node (prompt node)
          // Based on min-w-[420px] and content (title + textarea minHeight 160 + padding)
          const nodeWidth = 420;
          const nodeHeight = 220;

          // Adjust position so node center is at cursor instead of top-left corner
          const position = {
            x: cursorPosition.x - nodeWidth / 2,
            y: cursorPosition.y - nodeHeight / 2,
          };

          // Get addNodeAtPositionAndConnectToTarget from store
          const addNodeAtPositionAndConnectToTarget =
            useFlowStore.getState().addNodeAtPositionAndConnectToTarget;
          const updateNodeData = useFlowStore.getState().updateNodeData;

          // Create text-node at drop position and connect to prompt-input handle
          const newNodeId = addNodeAtPositionAndConnectToTarget(
            "text-node",
            position,
            nodeId,
            "prompt-input"
          );

          // Update prompt text in the created node
          if (newNodeId && prompt) {
            updateNodeData(newNodeId, { prompt });
          }

          // Clear embedded prompt in the image-generator-node
          if (newNodeId) {
            updateNodeData(nodeId, { prompt: "" });
          }

          return;
        } catch (error) {
          console.error("Error parsing prompt-node-drag data:", error);
          return;
        }
      }

      // Check if this is a ReactFlow node drop (existing behavior)
      const type = event.dataTransfer.getData("application/reactflow");

      if (type) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        addNode(type, position);

        if (type === "image-generator-node" && rfInstance) {
          detectImageGeneratorNodeDrop(rfInstance);
        }
        return;
      }

      // Check if this is a file drop (new behavior)
      const files = Array.from(event.dataTransfer.files);
      if (files.length === 0) {
        return;
      }

      // Convert drop position to flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Handle file drop - creates upload-node and populates with files
      await handleCanvasFileDrop(event, position);
    },
    [screenToFlowPosition, addNode, rfInstance]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // Handle double-click on nodes to zoom to them
  useEffect(() => {
    if (!rfInstance) return;

    const handleNodeDoubleClick = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as HTMLElement;

      // Prevent zoom if double-clicking inside embedded prompt area
      const embeddedPromptElement = target.closest(
        '[data-embedded-prompt="true"]'
      );
      if (embeddedPromptElement) {
        return;
      }

      // Find the closest ReactFlow node element
      const nodeElement = target.closest(".react-flow__node");
      if (!nodeElement) return;

      // Get the node ID from the data attribute
      const nodeId = nodeElement.getAttribute("data-id");
      if (!nodeId) return;

      // Find the node in the store
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Zoom to the specific node with minimal padding so it fills the screen
      rfInstance.fitView({
        nodes: [{ id: node.id }],
        padding: 0.0, // 0.0 = fills screen completely, increase for padding
        duration: 600, // Smooth animation duration in ms (slower for smoother transition)
        maxZoom: 2, // Optional: prevent over-zooming
        minZoom: 0.3, // Match your existing minZoom setting
      });
    };

    // Attach event listener to the ReactFlow viewport
    const reactFlowViewport = document.querySelector(".react-flow__viewport");
    if (reactFlowViewport) {
      reactFlowViewport.addEventListener("dblclick", handleNodeDoubleClick);
      return () => {
        reactFlowViewport.removeEventListener(
          "dblclick",
          handleNodeDoubleClick
        );
      };
    }
  }, [rfInstance, nodes]);

  const onMove = useCallback(() => {
    if (rfInstance && hasWalkthroughNodes && isStep1Active) {
      checkCircleCollision(rfInstance);
    }
    if (rfInstance && isStep3Active) {
      checkRectangleCoverage(rfInstance);
    }
    // success triggers on node drop, no collision detection needed
  }, [rfInstance, hasWalkthroughNodes, isStep1Active, isStep3Active]);

  const onNodesDelete = useCallback((deletedNodes: Node[]) => {
    // Skip during walkthrough
    if (isWalkthroughActive) {
      return;
    }
    // Delete each node
    deletedNodes.forEach((node) => {
      deleteNode(node.id);
    });
  }, [isWalkthroughActive, deleteNode]);

  const [isLoadingCanvas, setIsLoadingCanvas] = useState(true);
  const setReactFlowReady = useCanvasLoadingStore(
    (state) => state.setReactFlowReady
  );
  const setBackendLoaded = useCanvasLoadingStore(
    (state) => state.setBackendLoaded
  );
  const isCanvasReady = useIsCanvasReady();

  // Track ReactFlow initialization
  useEffect(() => {
    if (rfInstance) {
      setReactFlowReady(true);
    }
  }, [rfInstance, setReactFlowReady]);

  // Load canvas on mount
  useEffect(() => {
    const loadCanvas = async () => {
      // Check if canvasId was provided (from page.tsx)
      if (!canvasId) {
        // No canvas ID means this is a new canvas - initialize metadata store with null
        useCanvasMetadataStore.getState().setCanvasId(null);
        // Show walkthrough for new users (isActive: true = show)
        useWalkthroughStore.getState().setIsActive(true);
        // Mark loading as complete so UI can render
        setIsLoadingCanvas(false);
        setBackendLoaded(true);
        // Exit early - no canvas to load
        return;
      }

      // Canvas ID exists - initialize metadata store with the provided ID
      useCanvasMetadataStore.getState().setCanvasId(canvasId);

      // Hide walkthrough immediately to prevent UI flash before canvas loads
      // This must happen before async loading to avoid walkthrough showing briefly
      // isActive: false = hide walkthrough
      useWalkthroughStore.getState().setIsActive(false);

      try {
        // Fetch canvas data from backend using the canvas ID
        const canvasData = await performCanvasLoad(canvasId);

        // Check if canvas was found (null means canvas not found)
        if (!canvasData) {
          // Canvas not found - treat as new canvas, keep the provided canvasId
          useCanvasMetadataStore.getState().setCanvasId(canvasId);
          // Show walkthrough for new users/canvases (isActive: true = show)
          useWalkthroughStore.getState().setIsActive(true);
          // Mark loading as complete
          setIsLoadingCanvas(false);
          setBackendLoaded(true);
          // Exit early - no canvas to restore
          return;
        }

        // Restore the loaded canvas state (nodes, edges, configs, walkthrough)
        restoreCanvas(canvasData);

        // Update metadata store with the actual canvas ID from loaded data
        // Use loaded ID if available, otherwise fallback to provided canvasId
        useCanvasMetadataStore
          .getState()
          .setCanvasId(canvasData.id || canvasId);
        // Update metadata store with the project name from loaded data
        useCanvasMetadataStore.getState().setProjectName(canvasData.name);
      } catch (error) {
        // If loading fails, still initialize with the provided ID
        // This allows the user to continue working on a new canvas
        // Set canvas ID in metadata store so saves can still work
        useCanvasMetadataStore.getState().setCanvasId(canvasId);
      } finally {
        // Always mark loading as complete, regardless of success or failure
        setIsLoadingCanvas(false);
        setBackendLoaded(true);
      }
    };

    // Execute the load function when component mounts or canvasId changes
    loadCanvas();
  }, [canvasId]);

  // Track mouse position for paste (passive listener, no re-renders)
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

  // Keyboard handlers for copy/paste
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Skip during walkthrough
      if (isWalkthroughActive) {
        return;
      }

      // Settings panel toggle: Shift + P
      if (event.key === "P" && event.shiftKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();

        // Find the selected node from React Flow's nodes array
        const selectedNode = nodes.find((node) => node.selected);
        if (!selectedNode) {
          return;
        }

        const nodeId = selectedNode.id;

        // Track panel state: in view (slid in) vs slid out
        // Panel is in view when node is selected (we found a selected node, so it's in view)
        const isPanelInView = true;
        const isPanelMaximized = settingsNodeId === nodeId; // Panel is maximized when settingsNodeId matches

        if (isPanelMaximized) {
          // Panel is in view and maximized, minimize it
          setSettingsNodeId(null);
        } else {
          // Panel is in view but minimized, maximize it
          setSettingsNodeId(nodeId);
        }
        return;
      }

      // Copy: Cmd/Ctrl + C
      if (event.key === "c" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        copySelectedNodes();
        return;
      }

      // Paste: Cmd/Ctrl + V
      if (event.key === "v" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();

        // Get cursor position from ref
        const cursorPos = cursorPositionRef.current;
        if (!cursorPos) {
          return;
        }

        // Convert screen position to flow position
        let flowPosition: { x: number; y: number };
        if (rfInstance) {
          flowPosition = rfInstance.screenToFlowPosition({
            x: cursorPos.x,
            y: cursorPos.y,
          });
        } else if (screenToFlowPosition) {
          flowPosition = screenToFlowPosition({
            x: cursorPos.x,
            y: cursorPos.y,
          });
        } else {
          // Fallback to viewport center
          flowPosition = { x: 0, y: 0 };
        }

        pasteNodes(flowPosition);
        return;
      }

      // Undo: Cmd/Ctrl + Z (without Shift)
      if (
        event.key === "z" &&
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey
      ) {
        event.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z
      if (
        event.key === "z" &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        redo();
        return;
      }
    },
    [
      isWalkthroughActive,
      nodes,
      settingsNodeId,
      setSettingsNodeId,
      setSelectedNodeId,
      selectNode,
      copySelectedNodes,
      pasteNodes,
      undo,
      redo,
      rfInstance,
      screenToFlowPosition,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // show walkthrough or not
  const shouldShowWalkthrough = isWalkthroughActive && !isLoadingCanvas;

  return (
    <>
      {/* Show loading screen until canvas is fully ready */}
      {!isCanvasReady && <CanvasLoadingScreen />}

      <main
        className="relative z-0"
        style={{
          width: "100%",
          height: "100vh",
          backgroundColor: "#020304",
          opacity: isCanvasReady ? 1 : 0,
          transition: "opacity 0.2s ease-in",
          pointerEvents: isCanvasReady ? "auto" : "none",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setRfInstance}
          onPaneClick={onPaneClick}
          onMove={onMove}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineComponent={CustomConnectionLine}
          minZoom={0.3}
          isValidConnection={(connection) =>
            validateWalkthroughStep5Connection(
              connection,
              nodes,
              edges,
              isStep5Active
            )
          }
          fitView={!hasWalkthroughNodes}
          proOptions={{ hideAttribution: true }}
          onReconnect={onReconnect}
          edgesReconnectable={true}
          panOnDrag={true}
        >
          <Background
            color="#404040"
            variant={BackgroundVariant.Dots}
            gap={15}
            size={1}
          />
          {!isWalkthroughActive && (
            <Controls position="bottom-center" orientation="horizontal" />
          )}
          <TaskPanel />
          <TaskDetailsPanel />
          <NamePanel />
          {shouldShowWalkthrough && isStep1Active && <PurpleCircles />}
          {shouldShowWalkthrough && isStep2Active && <WalkthroughPromptNode />}
        </ReactFlow>
        <ConnectionMenu />
        {shouldShowWalkthrough && isStep1Active && <CircleOverlay />}
        {shouldShowWalkthrough && isStep3Active && <RectangleOverlay />}
        {shouldShowWalkthrough && isStep4Active && <CanvasOverlay />}
        {shouldShowWalkthrough && isStep4Active && <DropZone />}
        {shouldShowWalkthrough && isStep5Active && <HandleHighlight />}
        {shouldShowWalkthrough && isStep6Active && (
          <WalkthroughGenerateButton />
        )}
        {shouldShowWalkthrough && isStep7Active && <WalkthroughSuggestions />}
      </main>
    </>
  );
};

export default CanvasContent;
