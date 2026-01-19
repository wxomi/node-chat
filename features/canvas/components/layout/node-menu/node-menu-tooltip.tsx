import React from "react";
import { NODE_DESCRIPTIONS_CONFIG } from "@/features/canvas/constants/nodes/node-descriptions";
import { cn } from "@/lib/utils";

type NodeMenuTooltipProps = {
  nodeType: string;
};

type HandleFlowProps = {
  nodeType: string;
};

const dataTypeColorMap: Record<string, { bg: string; dot: string }> = {
  string: {
    bg: "bg-chart-1/20",
    dot: "bg-chart-1",
  },
  image: {
    bg: "bg-chart-2/20",
    dot: "bg-chart-2",
  },
  video: {
    bg: "bg-chart-5/20",
    dot: "bg-chart-5",
  },
  audio: {
    bg: "bg-chart-3/20",
    dot: "bg-chart-3",
  },
};

export const HandleFlow: React.FC<HandleFlowProps> = ({ nodeType }) => {
  const config = NODE_DESCRIPTIONS_CONFIG[nodeType];

  if (!config || (config.inputs.length === 0 && config.outputs.length === 0)) {
    return null;
  }

  const inputHandles = config.inputs.map((input) => ({
    label: input.label,
    colors: dataTypeColorMap[input.dataType] || dataTypeColorMap.string,
  }));

  const outputHandles = config.outputs.map((output) => ({
    label: output.label,
    colors: dataTypeColorMap[output.dataType] || dataTypeColorMap.string,
  }));

  return (
    <div className="flex items-center justify-start gap-2 flex-wrap">
      {inputHandles.map((handle, idx) => (
        <React.Fragment key={`input-${idx}`}>
          {idx > 0 && inputHandles.length > 1 && (
            <span className="text-muted-foreground text-[8px]">+</span>
          )}
          <div
            className={cn(
              "flex items-center justify-center gap-1 w-fit px-2 rounded-2xl",
              handle.colors.bg
            )}
          >
            <div
              className={cn(
                "size-2 rounded-full flex items-center justify-center",
                handle.colors.dot
              )}
            >
              <div className="bg-muted size-1 rounded-full flex items-center justify-center" />
            </div>
            <span className="text-[8px]">{handle.label}</span>
          </div>
        </React.Fragment>
      ))}

      {inputHandles.length > 0 && outputHandles.length > 0 && (
        <span className="text-muted-foreground text-[8px]">→</span>
      )}

      {outputHandles.map((handle, idx) => (
        <div
          key={`output-${idx}`}
          className={cn(
            "flex items-center justify-center gap-1 w-fit px-2 rounded-2xl",
            handle.colors.bg
          )}
        >
          <div
            className={cn(
              "size-2 rounded-full flex items-center justify-center",
              handle.colors.dot
            )}
          >
            <div className="bg-muted size-1 rounded-full flex items-center justify-center" />
          </div>
          <span className="text-[8px]">{handle.label}</span>
        </div>
      ))}
    </div>
  );
};

export const NodeMenuTooltip: React.FC<NodeMenuTooltipProps> = ({
  nodeType,
}) => {
  const config = NODE_DESCRIPTIONS_CONFIG[nodeType];

  if (!config) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-white">{config.description}</div>
      <HandleFlow nodeType={nodeType} />
    </div>
  );
};

export default NodeMenuTooltip;

