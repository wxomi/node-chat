"use client";

import React, { useCallback, useEffect } from "react";
import { MagicToolsIcon } from "@/constants/icons";
import Image from "next/image";
import { motion, useAnimate, useInView } from "motion/react";
import { MousePointer2Icon } from "lucide-react";

const Step6Illustration = () => {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: false });

  const handleAnimation = useCallback(async () => {
    // Animate button entrance with snappy spring animation
    await animate(
      "#generate-button",
      {
        opacity: 1,
        scale: 1,
      },
      {
        type: "spring",
        stiffness: 800,
        damping: 20,
        mass: 0.5,
      }
    );

    // Wait a moment before cursor starts moving
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Move cursor from initial position to button position (center)
    await animate(
      "#mouse-pointer",
      {
        x: -20,
        y: -50,
      },
      { duration: 0.6, ease: "easeInOut" }
    );

    // Trigger button click effect (scale down then back)
    await Promise.all([
      animate(
        "#generate-button",
        {
          scale: 0.96,
        },
        { duration: 0.1, ease: "easeOut" }
      ),
    ]);

    await animate(
      "#generate-button",
      {
        scale: 1,
      },
      { duration: 0.15, ease: "easeOut" }
    );

    // Move cursor back to initial position
    await animate(
      "#mouse-pointer",
      {
        x: -30,
        y: -10,
      },
      { duration: 0.6, ease: "easeInOut" }
    );
  }, [animate]);

  useEffect(() => {
    if (!isInView) return;
    let isRunning = true;
    const runAnimationLoop = async () => {
      while (isRunning) {
        await handleAnimation();
      }
    };
    runAnimationLoop();

    return () => {
      isRunning = false;
    };
  }, [isInView, handleAnimation]);

  return (
    <motion.div
      ref={scope}
      className="border border-[#27293D] rounded-lg bg-accent size-32 relative overflow-hidden flex items-center justify-center"
    >
      {/* Cursor pointer */}
      <motion.div
        className="absolute bottom-0 right-0 z-[100] will-change-transform"
        id="mouse-pointer"
        style={{ x: -30, y: -10 }}
      >
        <MousePointer2Icon className="size-3" />
      </motion.div>

      {/* Generate button */}
      <motion.button
        id="generate-button"
        className="inline-flex items-center justify-center gap-2 px-3 rounded-sm text-[11px] whitespace-nowrap font-medium h-[24px] relative overflow-hidden w-[85px] cursor-pointer"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          backgroundColor: "#5200ff",
          borderColor: "#5200ff",
          color: "white",
        }}
        transition={{
          duration: 0.15,
          ease: "easeOut",
        }}
        style={{
          borderWidth: "1px",
          borderStyle: "solid",
        }}
      >
        <span className="inline-flex items-center justify-center gap-2 relative z-10">
          <span className="inline-flex items-center justify-center gap-2">
            Generate
            <Image
              src={MagicToolsIcon}
              alt="magic tools"
              width={11}
              height={11}
              className="brightness-0 invert"
            />
          </span>
        </span>
      </motion.button>
    </motion.div>
  );
};

export default Step6Illustration;
