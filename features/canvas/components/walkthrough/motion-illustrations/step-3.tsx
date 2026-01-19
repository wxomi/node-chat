"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useAnimate, useInView } from "motion/react";
import Image from "next/image";
import { MouseIcon } from "lucide-react";
import { ArrowCloseIcon, ArrowOpenIcon } from "@/constants/icons";

const sentenceVariants = {
  hidden: {},
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const letterVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { opacity: { duration: 0 } } },
};

const Step3Illustration = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: false });

  const fullText =
    "Epic anime art of wizard casting a cosmic spell in the sky that says 'Magic Hour'.";

  const springConfig = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: 75,
      damping: 30,
      mass: 1,
    }),
    []
  );

  const handleAnimation = useCallback(async () => {
    // Synchronize both animations with the same spring config
    await Promise.all([
      animate("#prompt-node", { opacity: 1, scale: 1 }, springConfig),
      animate("#mouse-icons", { y: 0 }, springConfig),
    ]);

    await Promise.all([
      animate("#prompt-node", { scale: 0.4 }, springConfig),
      animate("#mouse-icons", { y: -50 }, springConfig),
    ]);
  }, [animate, springConfig]);

  useEffect(() => {
    if (!isInView) return;

    let isRunning = true;

    const runAnimationLoop = async () => {
      while (isRunning) {
        await handleAnimation();
        // Small delay before next iteration
        await new Promise((resolve) => setTimeout(resolve, 500));
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
      {/* mouse icons */}
      <motion.div
        className="absolute top-1/2 right-0 -translate-x-1/2 -translate-y-1/2 z-[100] will-change-transform"
        id="mouse-icons"
        style={{ y: -50 }}
      >
        <div className="relative">
          {/* Top arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-4">
            <Image
              src={ArrowCloseIcon}
              alt="top"
              width={8}
              height={8}
              className="brightness-0 invert"
            />
          </div>
          <MouseIcon className="size-4" strokeWidth={1} />
          {/* Bottom arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-4">
            <Image
              src={ArrowOpenIcon}
              alt="bottom"
              width={8}
              height={8}
              className="brightness-0 invert"
            />
          </div>
        </div>
      </motion.div>

      {/* prompt node */}
      <div
        className="bg-popover rounded-md pt-1 pb-2 px-2 w-[110px] h-[70px] border border-popover flex flex-col gap-1 will-change-transform"
        id="prompt-node"
        style={{ transform: "scale(0.6)" }}
      >
        <div className="text-[6px] text-muted-foreground">Prompt</div>
        <div className="w-full h-full bg-accent rounded-sm text-[4px] text-muted-foreground pt-2 pl-1">
          <AnimatePresence mode="wait">
            {isVisible && (
              <motion.span
                key={fullText}
                variants={sentenceVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="block"
              >
                {fullText.split("").map((char, i) => (
                  <motion.span key={`${char}-${i}`} variants={letterVariants}>
                    {char}
                  </motion.span>
                ))}
                <motion.span
                  variants={letterVariants}
                  animate={{ opacity: [1, 0] }}
                  transition={{
                    duration: 0.3,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  |
                </motion.span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Step3Illustration;
