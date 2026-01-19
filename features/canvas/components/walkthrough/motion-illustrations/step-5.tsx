"use client";

import React, { useEffect } from "react";
import { motion, useAnimate, useInView } from "motion/react";

// Placeholder handle component - visual only, no logic
const PlaceholderHandle = ({
  position = "right",
}: {
  position?: "left" | "right";
}) => {
  const chartColor = "var(--chart-1)"; // Purple color for prompt handles

  return (
    <div
      className={`absolute top-1/2 ${
        position === "right"
          ? "right-0 translate-x-1/2"
          : "left-0 -translate-x-1/2"
      } -translate-y-1/2 size-5 flex items-center justify-center`}
    >
      <div
        className="size-3 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: chartColor,
        }}
      >
        <div className="bg-popover size-2 rounded-full flex items-center justify-center">
          <div
            className="size-1 rounded-full"
            style={{
              backgroundColor: chartColor,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const Step5Illustration = () => {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: false });

  // Hide path when not in view
  useEffect(() => {
    if (!isInView) {
      animate("#connection-path", { opacity: 0 }, { duration: 0 });
    }
  }, [isInView, animate]);

  // Animation loop
  useEffect(() => {
    if (!isInView) return;

    const handleAnimation = async () => {
      // animate the entrance to bring in the nodes from both left and right sides
      await Promise.all([
        animate(
          "#node-1-container",
          { x: 0 },
          { duration: 0.3, ease: "easeOut" }
        ),
        animate(
          "#node-2-container",
          { x: 0 },
          { duration: 0.3, ease: "easeOut" }
        ),
      ]);

      // Reset path and keep it hidden
      await animate(
        "#connection-path",
        { pathLength: 0.001, opacity: 0 },
        { duration: 0.3 }
      );

      // Animate path drawing from bottom to top (make visible and draw)
      await animate(
        "#connection-path",
        { pathLength: 1, opacity: 1 },
        { duration: 0.8, ease: "easeInOut" }
      );

      // Hold for a moment
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reset and loop - hide path and reset length
      await animate(
        "#connection-path",
        { pathLength: 0.001, opacity: 0 },
        { duration: 0.3 }
      );
    };

    handleAnimation();
    const interval = setInterval(handleAnimation, 2000);

    return () => clearInterval(interval);
  }, [isInView, animate]);

  return (
    <div
      ref={scope}
      className="border border-[#27293D] rounded-lg bg-accent size-32 relative overflow-hidden"
    >
      {/* SVG for connection path */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
        viewBox="0 0 128 128"
        preserveAspectRatio="none"
      >
        <motion.path
          id="connection-path"
          d="M 30 92 C 50 110, 85 5, 98 28"
          fill="transparent"
          strokeWidth="1.5"
          stroke="var(--chart-1)"
          strokeLinecap="round"
          initial={{ pathLength: 0.001, opacity: 0 }}
          style={{
            filter: "drop-shadow(0 0 1px var(--chart-1))",
          }}
        />
      </svg>

      {/* node 1 */}
      {/* node 1 container */}
      <motion.div
        id="node-1-container"
        className="absolute top-16 left-[-50px]"
        style={{ x: -100 }}
      >
        <div className="bg-popover border border-popover rounded-sm w-20 h-14 relative">
          {/* output handle */}
          <PlaceholderHandle position="right" />
        </div>
      </motion.div>
      {/* node 2 */}
      <motion.div
        id="node-2-container"
        className="absolute top-0 right-[-50px]"
        style={{ x: 100 }}
      >
        <div className="bg-popover border border-popover rounded-sm w-20 h-14 relative">
          {/* input handle */}
          <PlaceholderHandle position="left" />
        </div>
      </motion.div>
    </div>
  );
};

export default Step5Illustration;
