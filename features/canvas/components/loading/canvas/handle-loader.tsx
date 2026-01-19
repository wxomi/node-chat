import {
  useIsClientHydrated,
  useIsReactFlowReady,
  useIsBackendLoaded,
  useIsSidebarMenuLoaded,
} from "@/features/canvas/stores/canvas-loading-store";
import { motion } from "motion/react";

type HandleProps = {
  color: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";
  isActive: boolean;
};

const Handle = ({ color, isActive }: HandleProps) => {
  const colorClasses = {
    "chart-1": "bg-chart-1",
    "chart-2": "bg-chart-2",
    "chart-3": "bg-chart-3",
    "chart-4": "bg-chart-4",
    "chart-5": "bg-chart-5",
  };

  const colorClass = colorClasses[color];

  return (
    <div
      className={`size-3 rounded-full flex items-center justify-center ${colorClass}`}
    >
      <div className="bg-popover size-2 rounded-full flex items-center justify-center">
        <motion.div
          className={`size-1 rounded-full ${colorClass}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: isActive ? 1 : 0.5,
            scale: isActive ? 1 : 0.5,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default function HandleLoader() {
  const isClientHydrated = useIsClientHydrated();
  const isReactFlowReady = useIsReactFlowReady();
  const isBackendLoaded = useIsBackendLoaded();
  const isSidebarMenuLoaded = useIsSidebarMenuLoaded();

  return (
    <>
      <div className="relative z-20 bg-popover border border-border flex items-center justify-center gap-3 px-4 py-2 rounded-xl ring-1 ring-offset-2 ring-node-selected ring-offset-background">
        <Handle color="chart-1" isActive={isClientHydrated} />
        <Handle color="chart-2" isActive={isReactFlowReady} />
        <Handle color="chart-3" isActive={isSidebarMenuLoaded} />
        <Handle color="chart-5" isActive={isBackendLoaded} />
      </div>
    </>
  );
}
