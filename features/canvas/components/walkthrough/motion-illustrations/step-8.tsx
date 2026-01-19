"use client";

import React from "react";
import Image from "next/image";
import magicHourLogo from "@/public/icons/magic-hour-logo.svg";

const Step8Illustration = () => {
  return (
    <div className="border border-[#27293D] rounded-lg bg-accent size-32 relative overflow-hidden flex items-center justify-center">
      <Image src={magicHourLogo} alt="magic hour logo" width={40} height={40} />
    </div>
  );
};

export default Step8Illustration;
