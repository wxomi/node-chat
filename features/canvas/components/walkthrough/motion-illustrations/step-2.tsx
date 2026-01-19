"use client";

import { motion, AnimatePresence, useInView } from "motion/react";
import React, { useEffect, useState, useRef } from "react";

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

const Step2Illustration = () => {
  const fullText =
    "Epic anime art of wizard casting a cosmic spell in the sky that says 'Magic Hour'.";
  const [isVisible, setIsVisible] = useState(true);
  const ref = useRef(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    const typingDuration = fullText.length * 30;
    const pauseDuration = 2000;

    if (isVisible) {
      // Set up timeout to hide text after typing completes
      const timeout = setTimeout(() => {
        setIsVisible(false);
        // Reset after fade out completes
        resetTimeoutRef.current = setTimeout(() => {
          setIsVisible(true);
          resetTimeoutRef.current = null;
        }, 500);
      }, typingDuration + pauseDuration);

      return () => {
        clearTimeout(timeout);
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = null;
        }
      };
    } else {
      // When not visible, set up reset timeout if one doesn't already exist
      if (!resetTimeoutRef.current) {
        resetTimeoutRef.current = setTimeout(() => {
          setIsVisible(true);
          resetTimeoutRef.current = null;
        }, 500);
      }

      return () => {
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = null;
        }
      };
    }
  }, [isInView, isVisible, fullText.length]);

  return (
    <div
      ref={ref}
      className="border border-[#27293D] rounded-lg bg-accent size-32 relative overflow-hidden flex items-center justify-center"
    >
      <AnimatePresence>
        {isInView && (
          <motion.div
            key="prompt-container"
            className="bg-popover rounded-md pt-1 pb-2 px-2 w-[110px] h-[70px] border border-popover flex flex-col gap-1 will-change-transform"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 0.8,
            }}
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
                      <motion.span
                        key={`${char}-${i}`}
                        variants={letterVariants}
                      >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Step2Illustration;
