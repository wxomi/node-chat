"use client";

import React, { useRef } from "react";
import { motion } from "motion/react";
import HandleLoader from "./handle-loader";
import { GridBackground } from "./grid-background";
import { PromptLoadingNode } from "./prompt-loading-node";
import { AIVoiceGeneratorLoadingNode } from "./ai-voice-generator-loading-node";
import { VideoGeneratorLoadingNode } from "./video-generator-loading-node";
import { AIImageEditorLoadingNode } from "./ai-image-editor-loading-node";
import mhLogo from "@/public/icons/magic-hour-logo.svg";
import Image from "next/image";
import AnimatedMHLogo from "./mh-logo";

export const CanvasLoadingScreen = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[9999] w-full h-screen bg-background flex items-center justify-center"
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 1.2, ease: [0.9, 0, 0.2, 1] }}
    >
      <GridBackground />
      <HandleLoader />
      <AnimatedMHLogo />
      <PromptLoadingNode containerRef={containerRef} />
      <AIVoiceGeneratorLoadingNode containerRef={containerRef} />
      <VideoGeneratorLoadingNode containerRef={containerRef} />
      <AIImageEditorLoadingNode containerRef={containerRef} />
    </motion.div>
  );
};
