"use client";

import React from "react";
import { Panel } from "@xyflow/react";
import { CustomNameInput } from "../../shared/controls";
import useCanvasMetadataStore from "../../../stores/canvas-metadata-store";

type NamePanelProps = {
  className?: string;
};

const NamePanel: React.FC<NamePanelProps> = ({ className }) => {
  const projectName = useCanvasMetadataStore((state) => state.projectName);
  const setProjectName = useCanvasMetadataStore((state) => state.setProjectName);

  const handleProjectNameSave = (newName: string) => {
    setProjectName(newName);
  };

  return (
    <Panel
      position="top-left"
      style={{ top: "10px" }}
      className={
        "px-3 rounded-md border shadow-sm text-xs text-white flex items-center gap-2 bg-sidebar-background border-border" +
        (className ? " " + className : "")
      }
    >
      <div className="w-32">
        <CustomNameInput
          value={projectName}
          onSave={handleProjectNameSave}
          height="h-[28px] bg-transparent"
          hideBorder
        />
      </div>
    </Panel>
  );
};

export default NamePanel;

