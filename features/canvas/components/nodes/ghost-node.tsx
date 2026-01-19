"use client";

import React, { memo, useState } from "react";
import Image from "next/image";
import { StaticImageData } from "next/image";
import { motion } from "motion/react";
import { MagneticAnimation } from "@/lib/animations/magnetic-animation";

type GhostNodeProps = {
  icon: StaticImageData;
  title: string;
  iconSize?: number;
  disabled?: boolean;
  onClick?: () => void;
};

const GhostNode: React.FC<GhostNodeProps> = memo(
  ({ icon, title, iconSize = 10, disabled = true, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <MagneticAnimation>
        <motion.div
          className={`w-fit rounded-full border flex items-center justify-center gap-1.5 px-4 py-1 transition-all cursor-pointer ${
            disabled && !isHovered
              ? "bg-gray-800 border-gray-900"
              : "bg-popover border-border"
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onClick}
          animate={{
            scale: isHovered && !disabled ? 1.05 : 1,
            opacity: 1,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Image
            src={icon}
            alt={title}
            width={iconSize}
            height={iconSize}
            className={`brightness-0 invert ${
              disabled && !isHovered ? "opacity-40" : ""
            }`}
          />
          <div
            className={`text-[12px] text-nowrap ${
              disabled && !isHovered ? "text-gray-500" : "text-white"
            }`}
          >
            {title}
          </div>
        </motion.div>
      </MagneticAnimation>
    );
  }
);

GhostNode.displayName = "GhostNode";

export default GhostNode;
