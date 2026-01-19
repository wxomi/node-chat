"use client";

import React, { forwardRef, useLayoutEffect, useState } from "react";
import { type HTMLMotionProps } from "motion/react";
import { TextareaAnimation } from "@/lib/animations/textarea-animation";
import { cn } from "@/lib/utils";

type MotionTextareaProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  animationDuration?: number;
  animationEase?:
    | "linear"
    | "easeIn"
    | "easeOut"
    | "easeInOut"
    | [number, number, number, number];
} & Omit<HTMLMotionProps<"textarea">, "value" | "onChange" | "ref">;

export const MotionTextarea = forwardRef<
  HTMLTextAreaElement,
  MotionTextareaProps
>(
  (
    {
      value,
      onChange,
      onBlur,
      placeholder,
      className,
      minHeight = 160,
      animationDuration = 0.15,
      animationEase = "easeOut",
      ...props
    },
    ref
  ) => {
    const [height, setHeight] = useState(`${minHeight}px`);

    // Auto-resize textarea height
    useLayoutEffect(() => {
      if (ref && "current" in ref && ref.current) {
        const textarea = ref.current;

        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        const newHeight = Math.max(scrollHeight, minHeight);

        setHeight(`${newHeight}px`);
      }
    }, [value, minHeight, ref]);

    return (
      <TextareaAnimation
        ref={ref}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none border border-[#27293D] rounded-lg p-3 bg-accent text-caption-desktop-regular placeholder:text-muted-foreground outline-none overflow-hidden h-auto",
          className
        )}
        height={height}
        minHeight={minHeight}
        animationDuration={animationDuration}
        animationEase={animationEase}
        {...props}
      />
    );
  }
);

MotionTextarea.displayName = "MotionTextarea";
