"use client";

import React, { useState, useEffect } from "react";
import { SparkleSmallIcon } from "@/constants/icons";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { STAR_ANIMATION_CONFIG } from "@/lib/animations/star-animation";

type SparkleInstance = {
  id: number;
  left: string;
  top: string;
  delay: number;
  rotation: number;
  lifespan: number;
  createdAt: number;
};

type GenerateButtonStarsProps = {
  isGenerating: boolean;
};

const GenerateButtonStars: React.FC<GenerateButtonStarsProps> = ({
  isGenerating,
}) => {
  // Track sparkle instances for continuous cycling
  const [sparkleInstances, setSparkleInstances] = useState<SparkleInstance[]>(
    []
  );

  // Create new sparkle instance
  const createSparkle = () => {
    const now = Date.now();
    return {
      id: now + Math.random(), // Unique ID using timestamp + random
      left: `${Math.random() * 85 + 5}%`,
      top: `${Math.random() * 85 + 5}%`,
      delay: Math.random() * 0.3,
      rotation: (Math.random() - 0.5) * 180,
      lifespan: 3.5 + Math.random() * 2, // Sparkle lives for 3.5-5.5 seconds
      createdAt: now,
    };
  };

  // Continuously spawn new sparkles while generating
  useEffect(() => {
    if (!isGenerating) {
      setSparkleInstances([]);
      return;
    }

    const spawnInterval = setInterval(() => {
      setSparkleInstances((prev) => {
        const newSparkle = createSparkle();
        // Keep max 15-22 sparkles visible at once
        const maxSparkles = 15 + Math.floor(Math.random() * 8);
        const now = Date.now();
        const filtered = prev.filter((sparkle) => {
          const age = now - sparkle.createdAt;
          return age < sparkle.lifespan * 1000;
        });
        return [...filtered, newSparkle].slice(-maxSparkles);
      });
    }, 300 + Math.random() * 200); // Spawn every 300-500ms

    return () => clearInterval(spawnInterval);
  }, [isGenerating]);

  // Clean up old sparkles
  useEffect(() => {
    if (!isGenerating) return;

    const cleanupInterval = setInterval(() => {
      setSparkleInstances((prev) => {
        const now = Date.now();
        return prev.filter((sparkle) => {
          const age = now - sparkle.createdAt;
          return age < sparkle.lifespan * 1000;
        });
      });
    }, 500);

    return () => clearInterval(cleanupInterval);
  }, [isGenerating]);

  return (
    <AnimatePresence>
      {isGenerating &&
        sparkleInstances.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{
              ...STAR_ANIMATION_CONFIG.initial,
              rotate: sparkle.rotation - 45,
            }}
            animate={{
              ...STAR_ANIMATION_CONFIG.animate,
              rotate: sparkle.rotation,
            }}
            exit={STAR_ANIMATION_CONFIG.exit}
            transition={{
              opacity: {
                duration: sparkle.lifespan,
                delay: sparkle.delay,
                ...STAR_ANIMATION_CONFIG.opacityTransition,
              },
              filter: {
                delay: sparkle.delay,
                ...STAR_ANIMATION_CONFIG.filterTransition,
              },
              rotate: {
                delay: sparkle.delay,
                ...STAR_ANIMATION_CONFIG.rotateTransition,
              },
              scale: {
                duration: sparkle.lifespan,
                delay: sparkle.delay,
                ...STAR_ANIMATION_CONFIG.scaleTransition,
              },
            }}
            className="absolute pointer-events-none"
            style={{
              left: sparkle.left,
              top: sparkle.top,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Image
              src={SparkleSmallIcon}
              alt="sparkle"
              width={4}
              height={4}
              className="brightness-0 invert"
            />
          </motion.div>
        ))}
    </AnimatePresence>
  );
};

GenerateButtonStars.displayName = "GenerateButtonStars";

export default GenerateButtonStars;
