"use client";

import React from "react";
import { MagicWandIcon } from "@/constants/icons";
import Image from "next/image";
import { motion, useMotionValue, useTransform, animate } from "motion/react";

type GenerateButtonWandProps = {
  isGenerating: boolean;
};

const GenerateButtonWand: React.FC<GenerateButtonWandProps> = ({
  isGenerating,
}) => {
  // Create circular path for smooth animation
  const radius = 5;
  const horizontalDrift = 5;

  const progress = useMotionValue(0);

  React.useEffect(() => {
    if (isGenerating) {
      const controls = animate(progress, [0, 1, 2, 3, 4], {
        duration: 5,
        repeat: Infinity,
        ease: "linear",
      });
      return () => controls.stop();
    } else {
      progress.set(0);
    }
  }, [isGenerating, progress]);

  // Calculate position along circular path with horizontal drift
  const x = useTransform(progress, (value) => {
    // Normalize value to 0-1 range for each circle
    const circleProgress = value % 1;
    const angle = circleProgress * Math.PI * 2;
    const circleX = Math.cos(angle) * radius;

    // Add horizontal drift: oscillate over 4 circle cycles
    const driftCycle = Math.floor(value) % 4;
    const driftProgress = value % 1;
    let driftOffset = 0;
    if (driftCycle === 0) {
      driftOffset = driftProgress * horizontalDrift;
    } else if (driftCycle === 1) {
      driftOffset = horizontalDrift - driftProgress * horizontalDrift;
    } else if (driftCycle === 2) {
      driftOffset = -driftProgress * horizontalDrift;
    } else {
      driftOffset = -horizontalDrift + driftProgress * horizontalDrift;
    }
    return circleX + driftOffset;
  });

  const y = useTransform(progress, (value) => {
    const circleProgress = value % 1;
    const angle = circleProgress * Math.PI * 2;
    return Math.sin(angle) * radius;
  });

  return (
    <span className="inline-flex items-center justify-center relative w-full h-full">
      <motion.div
        style={{
          x,
          y,
        }}
      >
        <Image
          src={MagicWandIcon}
          alt="magic wand"
          width={12}
          height={12}
          className="brightness-0 invert"
        />
      </motion.div>
    </span>
  );
};

GenerateButtonWand.displayName = "GenerateButtonWand";

export default GenerateButtonWand;
