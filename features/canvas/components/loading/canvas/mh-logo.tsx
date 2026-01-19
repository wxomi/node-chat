"use client";

import React from "react";
import Image from "next/image";
import mhLogo from "@/public/icons/magic-hour-logo.svg";
import { motion } from "motion/react";

const AnimatedMHLogo = () => {
  return (
    <motion.div
      className="absolute bottom-20"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: [1, 1.2, 1] }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Image src={mhLogo} alt="magic hour logo" width={48} height={48} />
    </motion.div>
  );
};

export default AnimatedMHLogo;
