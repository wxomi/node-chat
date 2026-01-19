export type WalkthroughStep = {
  id: number;
  title: string;
  description: string;
};

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 1,
    title: "Move to center the purple circles",
    description:
      "Click on the canvas and drag to pan the circles to the center.",
  },
  {
    id: 2,
    title: "This is your first node",
    description:
      "The prompt node holds text that is used to generate images, videos, and audio.",
  },
  {
    id: 3,
    title: "Zoom to fit the node in the box",
    description:
      "Move the scroll wheel to zoom in and out the node in the box.",
  },
  {
    id: 4,
    title: "Add an image generator node",
    description:
      "Drag the image generator node from the sidebar to the canvas.",
  },
  {
    id: 5,
    title: "Connect the prompt to the image generator node",
    description:
      "Click and drag from the output handle of the prompt node to the input handle of the image generator node.",
  },
  {
    id: 6,
    title: "Generate your first image.",
    description: "Click the generate button to generate your first image.",
  },
  {
    id: 7,
    title: "Smart suggestions",
    description:
      "Click the Video Generator suggestion to automatically add it to your flow.",
  },
  {
    id: 8,
    title: "Amazing work!",
    description: "Your first workflow is ready!",
  },
];

export const TOTAL_STEPS = WALKTHROUGH_STEPS.length;
