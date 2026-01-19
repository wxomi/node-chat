// lib/animations/node-animation.tsx
import React from "react";
import { motion } from "motion/react";

type NodeAnimationProps = {
  children: React.ReactNode;
  className?: string;
  layout?: boolean;
};

export const NodeAnimation: React.FC<NodeAnimationProps> = React.memo(
  ({ children, className, layout = false }) => {
    return (
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.85,
          y: -8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 800,
          damping: 20,
          mass: 0.5,
        }}
        className={className}
        // Performance optimizations
        layout={layout}
      >
        {children}
      </motion.div>
    );
  }
);

NodeAnimation.displayName = "NodeAnimation";
