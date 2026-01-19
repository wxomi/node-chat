"use client";

import React, {
  useCallback,
  useEffect,
  memo,
  useState,
  useRef,
  useMemo,
} from "react";
import { NodeResizer } from "@xyflow/react";
import { motion, AnimatePresence } from "motion/react";
import useFlowStore from "../../../stores/canvas-store";
import useConfigStore from "../../../stores/config-store";
import TextNodeColorMenuBar, {
  DEFAULT_COLOR,
  COLOR_OPTIONS,
} from "../../menu-bars/text-node-color-menu-bar";
import { cn } from "@/lib/utils";

type TextNodeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const TextNode: React.FC<TextNodeProps> = memo(({ id, selected, dragging }) => {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const setSelectedNodeId = useConfigStore((state) => state.setSelectedNodeId);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get text content from node data
  const textFromStore = useFlowStore(
    useCallback(
      (s) => (s.nodes.find((n) => n.id === id)?.data?.text as string) ?? "",
      [id]
    )
  );

  // Get node dimensions from store to calculate font size
  // Subscribe separately to avoid creating new object references
  const nodeWidth = useFlowStore(
    useCallback(
      (s) => {
        const node = s.nodes.find((n) => n.id === id);
        return (node?.width as number | undefined) ?? 200;
      },
      [id]
    )
  );

  const nodeHeight = useFlowStore(
    useCallback(
      (s) => {
        const node = s.nodes.find((n) => n.id === id);
        return (node?.height as number | undefined) ?? 150;
      },
      [id]
    )
  );

  // Subscribe to only color property from config store
  const backgroundColor = useConfigStore(
    (state) => state.nodeConfigs?.[id]?.color ?? DEFAULT_COLOR
  );

  // Get text color from color option for proper accessibility
  const textColor = useMemo(() => {
    const colorOption = COLOR_OPTIONS.find(
      (option) => option.hex === backgroundColor
    );
    return colorOption?.textHex || "#1a1b28";
  }, [backgroundColor]);

  // Find active color ID from backgroundColor
  const activeColorId = useMemo(() => {
    // This will be used by the menu bar to show active state
    return undefined; // Menu bar will find it based on hex match
  }, []);

  // Local state for typing
  const [text, setText] = useState<string>(textFromStore || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate font size based on node area
  // Initial: 200×150px = 30,000px² → 12px font
  // Formula: fontSize = 12 × sqrt(currentArea / 30000)
  // Using square root to make text grow slower as node area increases
  // Constraints: 10px min, 48px max
  const fontSize = useMemo(() => {
    const currentArea = nodeWidth * nodeHeight;
    const initialArea = 200 * 150; // 30,000px²
    const areaRatio = currentArea / initialArea;
    // Use square root to slow down growth - adjust the multiplier (12) to fine-tune
    const calculatedFontSize = 12 * Math.sqrt(areaRatio);
    return Math.max(10, Math.min(48, calculatedFontSize));
  }, [nodeWidth, nodeHeight]);

  // Sync local state when store data changes
  useEffect(() => {
    if (textFromStore !== text) {
      setText(textFromStore);
    }
  }, [textFromStore]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
    },
    []
  );

  const handleBlur = useCallback(() => {
    // Save to store when textarea loses focus
    updateNodeData(id, { text });
  }, [id, text, updateNodeData]);

  const handleNodeClick = useCallback(() => {
    setSelectedNodeId(id);
  }, [id, setSelectedNodeId]);

  // Min/max dimensions based on font size constraints
  // Min font (10px): ~183×137px (area: 25,000px²)
  // Max font (48px): 400×300px (area: 120,000px²)
  const MIN_WIDTH = 183;
  const MIN_HEIGHT = 137;
  const MAX_WIDTH = 400;
  const MAX_HEIGHT = 300;

  return (
    <>
      <NodeResizer
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        maxWidth={MAX_WIDTH}
        maxHeight={MAX_HEIGHT}
        keepAspectRatio={true}
        isVisible={selected}
      />

      {/* Color menu bar */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="flex items-center gap-1.5 rounded-lg p-2 max-w-fit absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-auto"
            style={{ zIndex: -1 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <TextNodeColorMenuBar
              nodeId={id}
              activeColorId={activeColorId}
              isMenuVisible={selected}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={containerRef}
        className={cn(
          "w-full h-full p-4 cursor-pointer flex flex-col border",
          "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3),0_2px_4px_-1px_rgba(0,0,0,0.2)]"
        )}
        style={{
          backgroundColor: backgroundColor,
          borderColor: selected ? "var(--node-selected-border)" : "transparent",
        }}
        onClick={handleNodeClick}
      >
        <textarea
          ref={textareaRef}
          value={text || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Write your note here..."
          className="w-full h-full resize-none bg-transparent border-none outline-none focus:ring-0 p-0 overflow-hidden placeholder:opacity-60"
          style={{
            color: textColor,
            fontSize: `${fontSize}px`,
          }}
        />
      </div>
    </>
  );
});

TextNode.displayName = "TextNode";

export default TextNode;
