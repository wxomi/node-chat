"use client";

import { motion, type HTMLMotionProps } from "motion/react";

type TextareaAnimationProps = {
  className?: string;
  height: string;
  minHeight: number;
  animationDuration?: number;
  animationEase?:
    | "linear"
    | "easeIn"
    | "easeOut"
    | "easeInOut"
    | [number, number, number, number];
} & Omit<HTMLMotionProps<"textarea">, "className">;

export const TextareaAnimation = ({
  className,
  height,
  minHeight,
  animationDuration = 0.15,
  animationEase = "easeOut",
  ...props
}: TextareaAnimationProps) => {
  return (
    <motion.textarea
      className={className}
      initial={{ height: `${minHeight}px` }}
      animate={{ height: height }}
      transition={{ duration: animationDuration, ease: animationEase }}
      {...props}
    />
  );
};
