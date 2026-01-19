import { create } from "zustand";
import { triggerCanvasSave } from "../lib/canvas";

type CanvasMetadataState = {
  canvasId: string | null;
  projectName: string;
  setCanvasId: (id: string | null) => void;
  setProjectName: (name: string) => void;
};

const useCanvasMetadataStore = create<CanvasMetadataState>((set, get) => ({
  canvasId: null,
  projectName: "Untitled",

  setCanvasId: (id: string | null) => {
    set({ canvasId: id });
  },

  setProjectName: (name: string) => {
    const currentName = get().projectName;
    // Only update if name actually changed
    if (currentName !== name) {
      set({ projectName: name });
      // Trigger save when project name changes
      const { canvasId } = get();
      triggerCanvasSave(canvasId || undefined, name);
    }
  },
}));

export default useCanvasMetadataStore;
