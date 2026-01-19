import { NodeTypes, EdgeTypes } from "@xyflow/react";
import {
  PromptNode,
  PromptEnhancerNode,
  ImageGeneratorNode,
  AIImageEditorNode,
  AIImageUpscalerNode,
  RemoveBackgroundNode,
  FaceSwapNode,
  UploadNode,
  SingleUploadNode,
  VideoGeneratorNode,
  AnimationNode,
  FaceSwapVideoNode,
  LipSyncNode,
  AIVoiceGeneratorNode,
  TextNode,
  PurpleCircleNode,
  ImageGeneratorNodePrototype,
  AIImageEditorNodePrototype,
  AIImageUpscalerNodePrototype,
  FaceSwapNodePrototype,
  AIVoiceGeneratorNodePrototype,
  VideoGeneratorNodePrototype,
} from "../components/nodes";
import CustomEdge from "../components/shared/connections/custom-edge";

export const nodeTypes: NodeTypes = {
  // walkthrough nodes
  "walkthrough-purple-circle": PurpleCircleNode,

  // core nodes
  "text-node": PromptNode,
  "prompt-enhancer-node": PromptEnhancerNode,
  "upload-node": UploadNode,
  "single-upload-node": SingleUploadNode,
  "image-generator-node": ImageGeneratorNode,
  "ai-image-editor-node": AIImageEditorNode,
  "ai-image-upscaler-node": AIImageUpscalerNode,
  "remove-background-node": RemoveBackgroundNode,
  "face-swap-node": FaceSwapNode,
  "video-generator-node": VideoGeneratorNode,
  "animation-node": AnimationNode,
  "face-swap-video-node": FaceSwapVideoNode,
  "lip-sync-node": LipSyncNode,
  "ai-voice-generator-node": AIVoiceGeneratorNode,
  "note-node": TextNode,

  // prototypes
  "image-generator-node-prototype": ImageGeneratorNodePrototype,
  "ai-image-editor-node-prototype": AIImageEditorNodePrototype,
  "ai-image-upscaler-node-prototype": AIImageUpscalerNodePrototype,
  "face-swap-node-prototype": FaceSwapNodePrototype,
  "ai-voice-generator-node-prototype": AIVoiceGeneratorNodePrototype,
  "video-generator-node-prototype": VideoGeneratorNodePrototype,
};

export const edgeTypes: EdgeTypes = {
  "custom-edge": CustomEdge,
};
