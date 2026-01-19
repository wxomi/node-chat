type SelectItem = {
  value: string;
  label: string;
};

export const SCALE_FACTOR_OPTIONS: SelectItem[] = [
  { value: "2", label: "2x (50 credits)" },
  { value: "4", label: "4x (200 credits)" },
];

export const ENHANCEMENT_OPTIONS: SelectItem[] = [
  { value: "Resemblance", label: "Resemblance" },
  { value: "Balanced", label: "Balanced" },
  { value: "Creative", label: "Creative" },
];
