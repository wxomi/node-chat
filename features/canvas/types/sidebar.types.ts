import { StaticImageData } from "next/image";

// Data types that can flow through handles
export type DataType = "string" | "image" | "video" | "audio";

// Handle configuration for React Flow
export type HandleConfig = {
  id: string; // Unique handle identifier
  type: "source" | "target"; // React Flow handle type
  dataType: DataType; // Type of data flowing through
  label?: string; // Optional human-readable label
  position: "top" | "bottom" | "left" | "right"; // Handle position
  required?: boolean; // Whether connection is required
  maxConnections?: number; // Maximum number of connections allowed (undefined = unlimited)
};

// Flow configuration for a node
export type NodeFlowConfig = {
  inputs: HandleConfig[];
  outputs: HandleConfig[];
};

// Enhanced preview node data with flow configuration
export type PreviewNodeData = {
  icon: StaticImageData;
  title: string;
  nodeType: string;
  iconSize?: number;
  flow?: NodeFlowConfig; // Input/output handle configurations
  configOptions?: boolean; // Whether this node has configuration options
};

export type PreviewNodeSection = {
  title: string;
  nodes: PreviewNodeData[];
};

export type PreviewNodesConstants = {
  [key: string]: PreviewNodeSection;
};
