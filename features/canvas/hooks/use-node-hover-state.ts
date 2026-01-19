import { useState, useMemo } from "react";

export function useNodeHoverState() {
  const [isNodeHovered, setIsNodeHovered] = useState<boolean>(false);
  const [isMenuHovered, setIsMenuHovered] = useState<boolean>(false);
  const [isGhostHovered, setIsGhostHovered] = useState<boolean>(false);
  const [isGhostContainerHovered, setIsGhostContainerHovered] =
    useState<boolean>(false);
  const [isInputGhostHovered, setIsInputGhostHovered] =
    useState<boolean>(false);

  // Memoize the combined hover state to prevent unnecessary recalculations
  const isHovered = useMemo(
    () =>
      isNodeHovered ||
      isMenuHovered ||
      isGhostHovered ||
      isGhostContainerHovered ||
      isInputGhostHovered,
    [
      isNodeHovered,
      isMenuHovered,
      isGhostHovered,
      isGhostContainerHovered,
      isInputGhostHovered,
    ]
  );

  return useMemo(
    () => ({
      isNodeHovered,
      setIsNodeHovered,
      isMenuHovered,
      setIsMenuHovered,
      isGhostHovered,
      setIsGhostHovered,
      isGhostContainerHovered,
      setIsGhostContainerHovered,
      isInputGhostHovered,
      setIsInputGhostHovered,
      isHovered,
    }),
    [
      isNodeHovered,
      isMenuHovered,
      isGhostHovered,
      isGhostContainerHovered,
      isInputGhostHovered,
      isHovered,
    ]
  );
}
