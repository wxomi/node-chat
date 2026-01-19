type SelectItem = {
  value: string;
  label: string;
};

export const GENERATION_MODE_OPTIONS: SelectItem[] = [
  {
    value: "lite",
    label: "Lite (Fast & Affordable)",
  },
  {
    value: "standard",
    label: "Standard (Natural & Accurate)",
  },
  {
    value: "pro",
    label: "Pro (Premium Fidelity)",
  },
];

export const TRIM_CONFIG = {
  startSeconds: {
    min: 0,
    max: 60,
    step: 1,
  },
  endSeconds: {
    min: 0.1,
    max: 60,
    step: 0.1,
  },
};

export const MAX_FPS_CONFIG = {
  min: 1,
  max: 60,
  step: 1,
};
