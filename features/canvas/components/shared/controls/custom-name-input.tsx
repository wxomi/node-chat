import React, { useState } from "react";
import { cn } from "@/lib/utils";

type CustomNameInputProps = {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  placeholder?: string;
  hideBorder?: boolean;
  height?: string;
  inputClassName?: string;
};

const CustomNameInput: React.FC<CustomNameInputProps> = ({
  value,
  onSave,
  className = "",
  placeholder = "Enter name",
  hideBorder = false,
  height = "h-8",
  inputClassName = "",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleClick = () => {
    setIsEditing(true);
    setTempValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue.trim()) {
      onSave(tempValue);
    } else {
      setTempValue(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTempValue(value);
    }
  };

  return (
    <div className="relative group">
      <input
        type="text"
        value={isEditing ? tempValue : value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        readOnly={!isEditing}
        autoFocus={isEditing}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg bg-transparent outline-none transition-all cursor-pointer",
          height,
          hideBorder
            ? "border-0"
            : cn(
                "border px-3 py-1",
                isEditing
                  ? "border-white cursor-text"
                  : "border-transparent hover:opacity-80"
              ),
          inputClassName
        )}
      />
    </div>
  );
};

CustomNameInput.displayName = "CustomNameInput";

export default CustomNameInput;
