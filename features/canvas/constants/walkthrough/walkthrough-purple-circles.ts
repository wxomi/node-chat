import { getPurpleCirclePositions } from "../../lib/walkthrough";

export type PurpleCircleConfig = {
  id: string;
  position: { x: number; y: number };
  number: number;
};

// Legacy constant for backward compatibility (uses default 1920x1080 viewport)
// For responsive positioning, use getPurpleCirclePositions() with current viewport size
export const PURPLE_CIRCLES_CONFIG: PurpleCircleConfig[] =
  getPurpleCirclePositions(1920, 1080);
