"use client";

import React, { useCallback, useEffect } from "react";
import { useAnimate, motion, useInView } from "motion/react";

const Step7Illustration = () => {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: false });

  const handleAnimation = useCallback(async () => {
    // First animate the node container in
    await animate(
      "#node-container",
      { x: 0 },
      { duration: 0.3, ease: "easeOut" }
    );

    // Then animate the suggestion nodes popping from center and floating to position
    await Promise.all([
      animate(
        "#suggestion-1",
        { x: 40, y: -24, opacity: 1, scale: 1 },
        {
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.5,
        }
      ),
      animate(
        "#suggestion-2",
        { x: 40, y: 0, opacity: 1, scale: 1 },
        {
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.5,
          delay: 0.05,
        }
      ),
      animate(
        "#suggestion-3",
        { x: 40, y: 24, opacity: 1, scale: 1 },
        {
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.5,
          delay: 0.1,
        }
      ),
    ]);

    // Wait for 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Animate suggestions back into the node container
    await Promise.all([
      animate(
        "#suggestion-1",
        { x: 0, y: 0, opacity: 0, scale: 0 },
        {
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.5,
        }
      ),
      animate(
        "#suggestion-2",
        { x: 0, y: 0, opacity: 0, scale: 0 },
        {
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.5,
          delay: 0.05,
        }
      ),
      animate(
        "#suggestion-3",
        { x: 0, y: 0, opacity: 0, scale: 0 },
        {
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.5,
          delay: 0.1,
        }
      ),
    ]);
  }, [animate]);

  useEffect(() => {
    if (!isInView) return;
    let isRunning = true;
    const runAnimationLoop = async () => {
      while (isRunning) {
        // Reset suggestions to initial state
        await Promise.all([
          animate(
            "#suggestion-1",
            { x: 0, y: 0, opacity: 0, scale: 0 },
            { duration: 0 }
          ),
          animate(
            "#suggestion-2",
            { x: 0, y: 0, opacity: 0, scale: 0 },
            { duration: 0 }
          ),
          animate(
            "#suggestion-3",
            { x: 0, y: 0, opacity: 0, scale: 0 },
            { duration: 0 }
          ),
        ]);
        // Run the animation sequence
        await handleAnimation();
      }
    };
    runAnimationLoop();

    return () => {
      isRunning = false;
    };
  }, [isInView, handleAnimation, animate]);

  return (
    <motion.div
      ref={scope}
      className="border border-[#27293D] rounded-lg bg-accent size-32 relative overflow-hidden flex items-center justify-center"
    >
      {/* node container */}
      <motion.div
        id="node-container"
        className="absolute top-[22px] left-[-20px] w-[60px] h-[80px] bg-popover border border-popover rounded-sm"
        style={{
          x: -100,
        }}
      ></motion.div>
      {/* suggestion nodes */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          top: 60,
          left: 30,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Miniature suggestion node 1 */}
        <motion.div
          id="suggestion-1"
          className="w-[40px] h-[12px] rounded-full border bg-popover border-border"
          style={{
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0,
          }}
        />
        {/* Miniature suggestion node 2 */}
        <motion.div
          id="suggestion-2"
          className="w-[40px] h-[12px] rounded-full border bg-popover border-border"
          style={{
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0,
          }}
        />
        {/* Miniature suggestion node 3 */}
        <motion.div
          id="suggestion-3"
          className="w-[40px] h-[12px] rounded-full border bg-popover border-border"
          style={{
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0,
          }}
        />
      </div>
    </motion.div>
  );
};

export default Step7Illustration;
