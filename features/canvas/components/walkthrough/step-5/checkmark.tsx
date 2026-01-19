"use client";

import React from "react";
import { motion } from "motion/react";
import { CheckIcon } from "lucide-react";
import {
  checkmarkInitial,
  checkmarkAnimate,
  checkmarkTransition,
} from "@/lib/animations/walkthrough-overlay-animation";

type CheckmarkProps = {
  isVisible: boolean;
};

const Checkmark: React.FC<CheckmarkProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
      initial={checkmarkInitial}
      animate={checkmarkAnimate}
      transition={checkmarkTransition}
    >
      <div className="size-10 bg-success/20 rounded-full flex items-center justify-center">
        <CheckIcon className="size-6 text-success mt-0.5" />
      </div>
    </motion.div>
  );
};

export default Checkmark;

