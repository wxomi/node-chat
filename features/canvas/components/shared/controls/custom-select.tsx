import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type SelectItem = {
  value: string;
  label: string;
  description?: string;
};

type CustomSelectProps = {
  label?: string;
  placeholder: string;
  value: string;
  defaultValue?: string;
  onValueChange: (value: string) => void;
  items: SelectItem[];
  className?: string;
};

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  items,
  className = "",
}) => {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-xs ml-1 text-muted-foreground">{label}</label>
      )}
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
      >
        <SelectTrigger
          className={cn(
            "w-full h-6 border border-input bg-transparent rounded-lg px-3 py-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none flex justify-between items-center",
            "[&_[data-slot=select-value]]:!text-[12px] [&_[data-slot=select-value]]:!bg-primary/40 [&_[data-slot=select-value]]:!text-center [&_[data-slot=select-value]]:!rounded-sm [&_[data-slot=select-value]]:!px-3 [&_[data-slot=select-value]]:!py-0.5",
            "[&>svg]:hidden",
            className
          )}
        >
          <span className="text-caption-desktop-regular text-muted-foreground">
            {placeholder}
          </span>
          {/* selected value badge with icon */}
          <div className="flex items-center gap-2">
            <SelectValue placeholder={placeholder} />
            <ChevronDownIcon className="size-4 opacity-50 pointer-events-none shrink-0" />
          </div>
        </SelectTrigger>
        <SelectContent
          data-settings-select-content="true"
          className="z-[110]"
          onPointerDownOutside={(event) => {
            // Prevent outside dismiss clicks from reaching the canvas pane.
            event.detail.originalEvent.stopPropagation();
          }}
        >
          {items.map((item) => {
            const selectItem = (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            );

            if (item.description) {
              return (
                <Tooltip key={item.value} delayDuration={0}>
                  <TooltipTrigger asChild>{selectItem}</TooltipTrigger>
                  <TooltipContent
                    className="z-[120] bg-muted text-white text-caption-desktop-regular py-1 px-3 rounded-md border border-border flex items-center gap-2"
                    side="right"
                    align="center"
                    sideOffset={16}
                  >
                    {item.description}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return selectItem;
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CustomSelect;
