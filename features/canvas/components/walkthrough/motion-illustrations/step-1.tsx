"use client";

import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { motion, useAnimate, usePresence, useInView } from "motion/react";
import Image from "next/image";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowCloseIcon,
  ArrowOpenIcon,
} from "@/constants/icons";

const Step1Illustration = () => {
  const [scope, animate] = useAnimate();
  const [isPresent] = usePresence();
  const animationRef = useRef<Promise<void> | null>(null);
  const isInViewRef = useRef(false);
  const isInView = useInView(scope, { once: false, margin: "-50px" });

  // Keep ref in sync with isInView for use in async function
  useEffect(() => {
    isInViewRef.current = isInView;
  }, [isInView]);

  const circleVariants = useMemo(
    () => ({
      initial: { scale: 0.5, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: {
        duration: 0.5,
        type: "spring",
        bounce: 0.3,
      },
    }),
    []
  );

  // Helper function to create delays - memoized
  const delay = useCallback(
    (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
    []
  );

  // Circle positions relative to bottom-right starting position - memoized
  const circlePositions = useMemo(
    () => [
      { x: 12, y: -52 }, // top-right (top-8 right-4)
      { x: -68, y: -68 }, // top-left (top-4 left-4)
      { x: -52, y: 4 }, // bottom-left (bottom-6 left-8)
    ],
    []
  );

  const handleEnterAnimation = useCallback(async () => {
    // Wait for DOM to be ready, then query all circle elements from scope
    const circleElements = scope.current?.querySelectorAll(".circles");
    const overlayElement = scope.current?.querySelector(".overlay");

    if (!circleElements || circleElements.length === 0 || !overlayElement)
      return;

    // Animate all circles in with stagger
    const circleAnimations = Array.from(circleElements).map((circle, index) => {
      return (animate as any)(
        `#circle-${index}`,
        {
          opacity: circleVariants.animate.opacity,
          scale: circleVariants.animate.scale,
        },
        {
          ...circleVariants.transition,
          delay: index * 0.1, // Stagger each circle by 0.1s
        }
      );
    });

    await Promise.all(circleAnimations);

    // Wait a bit before overlay appears
    await delay(200);

    // Fade in overlay at bottom-right - animate opacity and transform together
    // Immediately start first movement after fade-in completes for smooth transition
    const fadeInAnimation = animate(
      overlayElement as HTMLElement,
      {
        opacity: 1,
        transform: "translate(0px, 0px) scale(1) translateZ(0)",
      },
      {
        duration: 0.3,
        ease: "easeOut",
      }
    );

    await fadeInAnimation;

    // Animation loop - only run when both present and in view
    while (isPresent && isInViewRef.current) {
      for (const position of circlePositions) {
        if (!isPresent || !isInViewRef.current) break; // Exit if component is being removed or out of view
        // Move directly to each circle from bottom-right
        await animate(
          overlayElement as HTMLElement,
          {
            transform: `translate(${position.x}px, ${position.y}px) scale(1) translateZ(0)`,
          },
          {
            duration: 0.5,
            ease: "easeInOut",
          }
        );
        // Pause briefly at each circle
        await delay(400);
      }

      if (!isPresent || !isInViewRef.current) break; // Exit if component is being removed or out of view

      // Return to initial bottom-right position
      await animate(
        overlayElement as HTMLElement,
        {
          transform: "translate(0px, 0px) scale(1) translateZ(0)",
        },
        {
          duration: 0.6,
          ease: "easeInOut",
        }
      );

      // Wait before restarting
      await delay(500);
    }
  }, [scope, animate, circleVariants, delay, circlePositions, isPresent]);

  useEffect(() => {
    if (isPresent && isInView) {
      // Enter animation - only start when both present and in view
      animationRef.current = handleEnterAnimation();
    } else {
      // Stop animation when not in view or not present
      animationRef.current = null;
    }

    // Cleanup: cancel any running animations when component unmounts or presence/view changes
    return () => {
      animationRef.current = null;
    };
  }, [isPresent, isInView, handleEnterAnimation]);

  return (
    <motion.div
      className="border border-[#27293D] rounded-lg bg-accent size-32 relative overflow-hidden"
      ref={scope}
    >
      {/* purple circle placeholders */}
      <div
        id="circle-0"
        className="size-4 bg-primary rounded-full circles absolute top-8 right-4"
        style={{
          opacity: circleVariants.initial.opacity,
          transform: `scale(${circleVariants.initial.scale})`,
        }}
      />
      <div
        id="circle-1"
        className="size-4 bg-primary rounded-full circles absolute top-4 left-4"
        style={{
          opacity: circleVariants.initial.opacity,
          transform: `scale(${circleVariants.initial.scale})`,
        }}
      />
      <div
        id="circle-2"
        className="size-4 bg-primary rounded-full circles absolute bottom-6 left-8"
        style={{
          opacity: circleVariants.initial.opacity,
          transform: `scale(${circleVariants.initial.scale})`,
        }}
      />
      {/* circle overlay placeholder */}
      <motion.div
        className="size-10 bg-accent/20 rounded-full absolute bottom-4 right-4 border-2 border-node-selected-border overlay overflow-visible will-change-transform"
        style={{
          transform: "scale(0.9) translateZ(0)",
          opacity: 0,
          backfaceVisibility: "hidden",
          perspective: 1000,
        }}
      >
        {/* Arrow icons positioned around the circle - always rendered as part of overlay */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-3 pointer-events-none">
          <Image
            src={ArrowLeftIcon}
            alt="left"
            width={8}
            height={8}
            className="brightness-0 invert"
          />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-3 pointer-events-none">
          <Image
            src={ArrowRightIcon}
            alt="right"
            width={8}
            height={8}
            className="brightness-0 invert"
          />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 -top-3 pointer-events-none">
          <Image
            src={ArrowCloseIcon}
            alt="top"
            width={8}
            height={8}
            className="brightness-0 invert"
          />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 pointer-events-none">
          <Image
            src={ArrowOpenIcon}
            alt="bottom"
            width={8}
            height={8}
            className="brightness-0 invert"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Step1Illustration;
