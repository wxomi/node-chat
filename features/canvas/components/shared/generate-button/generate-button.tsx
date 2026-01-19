"use client";

import React from "react";
import { MagicToolsIcon } from "@/constants/icons";
import { Check, AlertCircle } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import GenerateButtonStars from "./generate-button-stars";
import GenerateButtonWand from "./generate-button-wand";
import { cn } from "@/lib/utils";

type ButtonState = "idle" | "generating" | "completed" | "error";

export type { ButtonState };

type GenerateButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  state?: ButtonState;
  className?: string;
  isWalkthrough?: boolean;
  label?: string;
};

const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  disabled = false,
  isLoading = false,
  state,
  className,
  isWalkthrough = false,
  label = "Generate",
}) => {
  // Use state prop if provided, otherwise fall back to isLoading
  const currentState: ButtonState =
    state ?? (isLoading ? "generating" : "idle");
  const isButtonDisabled = disabled || isLoading;
  const isGenerating = currentState === "generating";

  // Determine button styling based on state
  const getButtonClassName = () => {
    const baseClasses = cn(
      "inline-flex items-center justify-center gap-1.5 px-3 rounded-sm text-[12px] whitespace-nowrap font-medium h-[26px] relative overflow-hidden w-[98px]",
      isWalkthrough && "ring-1 ring-secondary-foreground"
    );

    if (isButtonDisabled) {
      return `${baseClasses} cursor-not-allowed opacity-90 bg-muted text-sidebar-foreground ${
        className || ""
      }`;
    }

    return `${baseClasses} cursor-pointer ${className || ""}`;
  };

  // Get colors based on state
  const getButtonColors = () => {
    if (currentState === "error") {
      return {
        backgroundColor: "#ff5d5d", // --destructive
        borderColor: "#ff5d5d",
        color: "white", // --destructive-foreground
      };
    }
    return {
      backgroundColor: "#5200ff", // --primary
      borderColor: "#5200ff",
      color: "white", // --primary-foreground
    };
  };

  const buttonColors = getButtonColors();

  return (
    <div className="flex justify-end">
      <motion.button
        whileTap={{ scale: 0.96 }}
        className={getButtonClassName()}
        animate={{
          backgroundColor: buttonColors.backgroundColor,
          borderColor: buttonColors.borderColor,
          color: buttonColors.color,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          borderWidth: "1px",
          borderStyle: "solid",
        }}
        onClick={onClick}
        disabled={isButtonDisabled}
      >
        {/* Sparkles - positioned relative to button */}
        <GenerateButtonStars isGenerating={isGenerating} />

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            transition={{
              type: "spring",
              duration: 0.4,
              bounce: 0,
            }}
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            key={currentState}
            className="inline-flex items-center gap-1.5 relative z-10"
          >
            {currentState === "generating" ? (
              <GenerateButtonWand isGenerating={isGenerating} />
            ) : currentState === "completed" ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <Check size={16} className="brightness-0 invert" />
                </motion.div>
              </span>
            ) : currentState === "error" ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <AlertCircle size={16} />
                </motion.div>
              </span>
            ) : (
              <>
                <span className="inline-flex items-center justify-center gap-1.5">
                  {label}
                  <Image
                    src={MagicToolsIcon}
                    alt="magic tools"
                    width={12}
                    height={12}
                    className="brightness-0 invert"
                  />
                </span>
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

GenerateButton.displayName = "GenerateButton";

export default GenerateButton;
