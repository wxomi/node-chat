import { create } from "zustand";

type CanvasLoadingState = {
  isClientHydrated: boolean;
  isReactFlowReady: boolean;
  isBackendLoaded: boolean;
  isSidebarMenuLoaded: boolean;
  setClientHydrated: (hydrated: boolean) => void;
  setReactFlowReady: (ready: boolean) => void;
  setBackendLoaded: (loaded: boolean) => void;
  setSidebarMenuLoaded: (loaded: boolean) => void;
};

export const useCanvasLoadingStore = create<CanvasLoadingState>((set) => ({
  isClientHydrated: false,
  isReactFlowReady: false,
  isBackendLoaded: false,
  isSidebarMenuLoaded: false,

  setClientHydrated: (hydrated) => set({ isClientHydrated: hydrated }),
  setReactFlowReady: (ready) => set({ isReactFlowReady: ready }),
  setBackendLoaded: (loaded) => set({ isBackendLoaded: loaded }),
  setSidebarMenuLoaded: (loaded) => set({ isSidebarMenuLoaded: loaded }),
}));

// Performance-optimized selector hooks to minimize re-renders
export const useIsClientHydrated = () =>
  useCanvasLoadingStore((state) => state.isClientHydrated);

export const useIsReactFlowReady = () =>
  useCanvasLoadingStore((state) => state.isReactFlowReady);

export const useIsBackendLoaded = () =>
  useCanvasLoadingStore((state) => state.isBackendLoaded);

export const useIsSidebarMenuLoaded = () =>
  useCanvasLoadingStore((state) => state.isSidebarMenuLoaded);

// Computed selector for overall loading state
export const useIsCanvasReady = () => {
  const isClientHydrated = useIsClientHydrated();
  const isReactFlowReady = useIsReactFlowReady();
  const isBackendLoaded = useIsBackendLoaded();
  const isSidebarMenuLoaded = useIsSidebarMenuLoaded();
  return isClientHydrated && isReactFlowReady && isBackendLoaded && isSidebarMenuLoaded;
};

// Get loading progress as a percentage (0-100)
export const useLoadingProgress = () => {
  const isClientHydrated = useIsClientHydrated();
  const isReactFlowReady = useIsReactFlowReady();
  const isBackendLoaded = useIsBackendLoaded();
  const isSidebarMenuLoaded = useIsSidebarMenuLoaded();
  
  const completed = [
    isClientHydrated,
    isReactFlowReady,
    isBackendLoaded,
    isSidebarMenuLoaded,
  ].filter(Boolean).length;
  
  return (completed / 4) * 100;
};

