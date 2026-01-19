import { z } from "zod";

/**
 * Zod schema for ReactFlow Node position
 */
const nodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/**
 * Zod schema for ReactFlow Node
 * Matches the Node type from @xyflow/react
 * Validates essential required fields while allowing flexibility for optional fields
 */
const reactFlowNodeSchema: z.ZodType<any> = z
  .object({
    id: z.string().min(1, "Node ID is required"),
    type: z.string().optional(),
    position: nodePositionSchema,
    data: z.any(), // Custom data structure varies by node type
    // Optional fields that ReactFlow may add
    width: z.number().optional(),
    height: z.number().optional(),
    selected: z.boolean().optional(),
    dragging: z.boolean().optional(),
    measured: z
      .object({
        width: z.number(),
        height: z.number(),
      })
      .optional(),
    style: z.any().optional(),
    className: z.string().optional(),
    hidden: z.boolean().optional(),
    parentNode: z.string().optional(),
    zIndex: z.number().optional(),
    extent: z.any().optional(),
    expandParent: z.boolean().optional(),
    focusable: z.boolean().optional(),
    deletable: z.boolean().optional(),
    connectable: z.boolean().optional(),
    selectable: z.boolean().optional(),
    dragHandle: z.string().optional(),
  })
  .loose(); // Allow additional fields that ReactFlow may add

/**
 * Zod schema for ReactFlow Edge
 * Matches the Edge type from @xyflow/react
 * Validates essential required fields while allowing flexibility for optional fields
 */
const reactFlowEdgeSchema: z.ZodType<any> = z
  .object({
    id: z.string().min(1, "Edge ID is required"),
    source: z.string().min(1, "Edge source is required"),
    target: z.string().min(1, "Edge target is required"),
    sourceHandle: z.string().nullable().optional(),
    targetHandle: z.string().nullable().optional(),
    type: z.string().optional(),
    animated: z.boolean().optional(),
    hidden: z.boolean().optional(),
    deletable: z.boolean().optional(),
    focusable: z.boolean().optional(),
    selectable: z.boolean().optional(),
    updatable: z.boolean().optional(),
    data: z.any().optional(),
    style: z.any().optional(),
    className: z.string().optional(),
    label: z.string().optional(),
    labelStyle: z.any().optional(),
    labelShowBg: z.boolean().optional(),
    labelBgStyle: z.any().optional(),
    labelBgPadding: z.array(z.number()).optional(),
    labelBgBorderRadius: z.number().optional(),
    markerStart: z.any().optional(),
    markerEnd: z.any().optional(),
    pathOptions: z.any().optional(), // For smoothstep/bezier edges
    zIndex: z.number().optional(),
  })
  .loose(); // Allow additional fields that ReactFlow may add

/**
 * Zod schema for CanvasSaveData
 * Single source of truth for canvas save/load data structure
 */
export const canvasSaveDataSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Canvas name is required"),
  graphIndex: z.object({
    nodes: z.array(reactFlowNodeSchema).default([]),
    edges: z.array(reactFlowEdgeSchema).default([]),
    viewport: z
      .object({
        x: z.number(),
        y: z.number(),
        zoom: z.number(),
      })
      .optional(),
  }),
  walkthrough: z.boolean(),
  nodeConfigs: z.record(z.string(), z.any()).default({}),
  updatedAt: z.iso.datetime({
    message: "updatedAt must be a valid ISO datetime string",
  }),
});

// Infer TypeScript type from Zod schema (single source of truth)
export type CanvasSaveData = z.infer<typeof canvasSaveDataSchema>;

/**
 * Validate CanvasSaveData and return parsed data
 * Throws ZodError if validation fails
 */
export function validateCanvasSaveData(data: unknown): CanvasSaveData {
  return canvasSaveDataSchema.parse(data);
}

/**
 * Safely validate CanvasSaveData and return result
 * Returns success/error object instead of throwing
 */
export function safeValidateCanvasSaveData(data: unknown) {
  return canvasSaveDataSchema.safeParse(data);
}
