"use client";

import React, { useCallback, useEffect } from "react";
import { animate, motion, useAnimate, useInView } from "motion/react";
import { MousePointer2Icon } from "lucide-react";

const Step4Illustration = () => {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: false });

  const handleAnimation = useCallback(async () => {
    // Reset sidebar position
    await animate(
      ".node-menu",
      {
        x: -100,
      },
      { duration: 0 }
    );

    await Promise.all([
      // entrance
      animate(
        ".node-menu",
        {
          x: 0,
        },
        { duration: 0.5, ease: "easeOut" }
      ),

      // mouse pointer entrance
      animate(
        "#mouse-pointer",
        {
          y: 50,
          x: -20,
        },
        { duration: 0.5, ease: "easeOut" }
      ),
    ]);

    // delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // mouse pointer to node
    await animate(
      "#mouse-pointer",
      {
        y: -45,
        x: -100,
      },
      { duration: 0.6, ease: "easeInOut" }
    );

    // move both the pointer and the image generator node to the right centre now
    await Promise.all([
      animate(
        "#mouse-pointer",
        {
          y: 0,
          x: -20,
        },
        { duration: 0.6, ease: "easeInOut" }
      ),
      animate(
        "#image-generator-node",
        {
          y: 45,
          x: 80,
        },
        { duration: 0.6, ease: "easeInOut" }
      ),
    ]);

    await Promise.all([
      // move the mouse pointer away
      animate(
        "#mouse-pointer",
        {
          x: 100,
        },
        { duration: 0.3, ease: "easeOut" }
      ),
      // layout animation - snappy scale with bounce
      animate(
        "#image-generator-node",
        {
          scale: 4,
        },
        {
          type: "spring",
          stiffness: 800,
          damping: 20,
          mass: 0.5,
        }
      ),
    ]);

    // Hold the scaled node for a moment
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Fade out the scaled node and reset everything
    await Promise.all([
      // Fade out the scaled node
      animate(
        "#image-generator-node",
        {
          opacity: 0,
        },
        { duration: 0.3, ease: "easeOut" }
      ),
      // Move cursor back to starting position
      animate(
        "#mouse-pointer",
        {
          x: -20,
          y: 100,
        },
        { duration: 0.4, ease: "easeInOut" }
      ),
    ]);

    // Reset node to initial state (instant, invisible)
    await animate(
      "#image-generator-node",
      {
        scale: 1,
        x: 0,
        y: 0,
        opacity: 0,
      },
      { duration: 0 }
    );

    // Fade in the original node at initial position
    await animate(
      "#image-generator-node",
      {
        opacity: 1,
      },
      { duration: 0.3, ease: "easeIn" }
    );

    // Slide sidebar back to initial position
    await animate(
      ".node-menu",
      {
        x: -100,
      },
      { duration: 0.5, ease: "easeOut" }
    );
  }, [animate, scope]);

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
      className="border border-[#27293D] rounded-lg bg-accent size-32 relative overflow-hidden"
    >
      {/* mouse pointer */}
      <motion.div
        className="absolute top-1/2 right-0 -translate-x-1/2 -translate-y-1/2 z-[100] will-change-transform"
        id="mouse-pointer"
        style={{ y: 100, x: -20 }}
      >
        <MousePointer2Icon className="size-3" />
      </motion.div>

      {/* sidebar */}
      <motion.div
        className="h-full w-[40px] border-r border-sidebar-border bg-sidebar-background flex flex-col gap-2 py-4 px-1 node-menu"
        style={{ x: -100 }}
      >
        {/* placeholder nodes */}
        <div className="flex gap-2 justify-center">
          <motion.div
            className="bg-border rounded-[2px] size-3 border border-border"
            id="image-generator-node"
            style={{ opacity: 1 }}
          ></motion.div>
          <div className="bg-border rounded-[2px] size-3"></div>
        </div>
        <div className="flex gap-2 justify-center">
          <div className="bg-border rounded-[2px] size-3"></div>
          <div className="bg-border rounded-[2px] size-3"></div>
        </div>
        <div className="flex gap-2 justify-center">
          <div className="bg-border rounded-[2px] size-3"></div>
          <div className="bg-border rounded-[2px] size-3"></div>
        </div>
        <div className="flex gap-2 justify-center">
          <div className="bg-border rounded-[2px] size-3"></div>
          <div className="bg-border rounded-[2px] size-3"></div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Step4Illustration;
