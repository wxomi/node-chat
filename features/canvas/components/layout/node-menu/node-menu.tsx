import React, { useState, useMemo, useRef, useEffect } from "react";
import SearchInput from "./search-button";
import PreviewNode from "./preview-node";
import { CustomNameInput } from "../../shared/controls";
import {
  getAllPreviewSections,
  searchTools,
  getSectionTitleForScroll,
} from "../../../lib/shared";
import { PreviewNodeSection } from "../../../types/sidebar.types";
import { useIsStepActive } from "../../../stores/walkthrough-store";
import useCanvasMetadataStore from "../../../stores/canvas-metadata-store";

type NodeMenuProps = {
  isVisible: boolean;
  selectedSection?: string;
};

const NodeMenu = ({ isVisible, selectedSection }: NodeMenuProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const isStep4Active = useIsStepActive(4);
  const projectName = useCanvasMetadataStore((state) => state.projectName);
  const setProjectName = useCanvasMetadataStore(
    (state) => state.setProjectName
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Always show all sections instead of filtering
  const baseSections = getAllPreviewSections();

  // Apply search filtering using useMemo for optimization
  const sectionsToShow = useMemo((): PreviewNodeSection[] => {
    return searchTools(baseSections, searchTerm);
  }, [baseSections, searchTerm]);

  // Scroll to selected section when it changes
  useEffect(() => {
    if (!selectedSection || !scrollContainerRef.current) return;

    const targetTitle = getSectionTitleForScroll(selectedSection);

    if (targetTitle === "") {
      // Scroll to top for search
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Find the section element by title
    const sectionElement = sectionRefs.current.get(targetTitle);
    if (sectionElement) {
      sectionElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  }, [selectedSection]);

  const setSectionRef = (title: string, element: HTMLDivElement | null) => {
    if (element) {
      sectionRefs.current.set(title, element);
    } else {
      sectionRefs.current.delete(title);
    }
  };

  const handleProjectNameSave = (newName: string) => {
    setProjectName(newName);
  };

  return (
    <aside
      className="fixed top-0 h-full w-[250px] bg-sidebar-background border-r border-sidebar-border z-10 transition-all duration-200 ease-in-out flex flex-col"
      style={{
        left: isVisible ? "70px" : "-200px",
        opacity: isVisible ? 1 : 0.6,
      }}
    >
      {/* Fixed header */}
      <div className="mt-2 text-[14px] font-regular tracking-tight px-4 py-6">
        <CustomNameInput value={projectName} onSave={handleProjectNameSave} />
      </div>

      {/* Fixed search section */}
      <div className="py-6 px-4 border-y border-border flex-shrink-0">
        <SearchInput
          placeholder="Search"
          className="w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Scrollable tools section */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto node-menu-scrollbar px-4 py-6"
      >
        <div className="flex flex-col gap-7">
          {sectionsToShow.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              ref={(el) => setSectionRef(section.title, el)}
              className="flex flex-col gap-5 scroll-mt-4"
            >
              <div className="text-base font-semibold tracking-tight">
                {section.title}
              </div>
              {/* tools container */}
              <div className="flex flex-wrap gap-6">
                {/* Tool node structure */}
                {section.nodes.map((node, nodeIndex) => (
                  <PreviewNode
                    key={nodeIndex}
                    icon={node.icon}
                    title={node.title}
                    nodeType={node.nodeType}
                    iconSize={node.iconSize}
                    disabled={
                      isStep4Active && node.nodeType !== "image-generator-node"
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default NodeMenu;
