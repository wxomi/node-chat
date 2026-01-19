"use client";

import React from "react";
import Image from "next/image";
import { ArrowOpenIcon } from "@/constants/icons";
import { StaticImageData } from "next/image";

type AddGenerateToggleProps = {
  icons: StaticImageData[];
  disabled?: boolean;
};

const AddGenerateToggle: React.FC<AddGenerateToggleProps> = ({
  icons,
  disabled = false,
}) => {
  return (
    <div className="w-fit h-[26px] px-2 rounded-sm flex items-center justify-center border border-border gap-2">
      {/* icon holder */}
      <div className="flex items-center justify-center">
        {icons.map((icon, index) => (
          <div
            key={index}
            className="bg-sidebar-accent border-[#27293D] border rounded-full size-5 flex items-center justify-center relative"
            style={{
              zIndex: icons.length - index,
              marginLeft: index === 0 ? 0 : "-8px",
            }}
          >
            <Image
              src={icon}
              alt={`node-icon-${index}`}
              width={8}
              height={8}
              className="brightness-0 invert"
            />
          </div>
        ))}
      </div>
      <Image
        src={ArrowOpenIcon}
        alt="arrow open"
        width={12}
        height={12}
        className="brightness-0 invert mt-[0.5px]"
      />
    </div>
  );
};

AddGenerateToggle.displayName = "AddGenerateToggle";

export default AddGenerateToggle;
