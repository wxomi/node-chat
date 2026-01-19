import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type CustomSliderProps = {
  label?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  inputClassName?: string;
};

const CustomSlider: React.FC<CustomSliderProps> = ({
  label,
  value,
  onValueChange,
  min = 1,
  max = 5,
  step = 1,
  inputClassName,
}) => {
  const [localValue, setLocalValue] = useState([value]);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    setLocalValue([value]);
  }, [value]);

  const handleValueChange = (newValue: number[]) => {
    setLocalValue(newValue);
  };

  const handleValueCommit = (newValue: number[]) => {
    onValueChange(newValue[0]);
  };

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-xs ml-1 text-muted-foreground">{label}</label>
      )}
      <div className="relative w-full flex items-center gap-3">
        <div className="flex-1">
          <SliderPrimitive.Root
            value={localValue}
            min={min}
            max={max}
            step={step}
            onValueChange={handleValueChange}
            onValueCommit={handleValueCommit}
            className="relative flex w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-border">
              <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>

            <SliderPrimitive.Thumb asChild>
              <motion.div
                className={cn(
                  "block h-4 w-4 rounded-full border border-border bg-popover shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileTap={{ scale: 0.96 }}
                transition={{
                  ease: "easeOut",
                  duration: 0.2,
                }}
              >
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 -top-6 px-2 py-1 rounded bg-popover text-foreground border border-border text-xs font-medium transition-all duration-200 ease-in-out ${
                    isHovered ? "opacity-100 " : "opacity-0 pointer-events-none"
                  }`}
                >
                  {localValue[0]}
                </div>
              </motion.div>
            </SliderPrimitive.Thumb>
          </SliderPrimitive.Root>
        </div>
        <input
          type="text"
          value={localValue[0]}
          readOnly
          className={`w-8 h-6 border border-border bg-transparent rounded-md px-2 py-0 text-xs text-foreground text-center focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${
            inputClassName || ""
          }`}
        />
      </div>
    </div>
  );
};

CustomSlider.displayName = "CustomSlider";

export default CustomSlider;
