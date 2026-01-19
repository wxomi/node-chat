"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SearchIcon } from "@/constants/icons";
import { Kbd } from "@/components/ui/kbd";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchInput = ({
  placeholder = "Search",
  className,
  value,
  onChange,
  ...props
}: SearchInputProps) => {
  return (
    <div className="relative group">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <Image
          src={SearchIcon}
          alt="Search"
          width={16}
          height={21}
          className={cn(
            "w-4 h-4 transition-all duration-200",
            "group-focus-within:brightness-0 group-focus-within:invert"
          )}
        />
      </div>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center gap-0.5">
        <Kbd className="h-4 min-w-4 text-[10px] rounded-[3px] px-0.5 bg-muted border border-border">
          ⌘
        </Kbd>
        <Kbd className="h-4 min-w-4 text-[10px] rounded-[3px] px-0.5 bg-muted border border-border">
          K
        </Kbd>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full h-8 rounded-lg border border-input bg-transparent py-1 pl-8 pr-16 text-base md:text-sm",
          "placeholder:text-muted-foreground",
          "outline-none",
          "focus:border-white transition-colors",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  );
};

export default SearchInput;
