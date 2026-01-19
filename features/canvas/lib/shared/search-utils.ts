import {
  PREVIEW_NODES,
  getAllPreviewSections as getAllPreviewSectionsFromConstants,
} from "../../constants/nodes/preview-nodes";

// Re-export for convenience
export const getAllPreviewSections = getAllPreviewSectionsFromConstants;

/**
 * Maps sidebar menu IDs to preview node sections and returns the appropriate data
 * @param selectedSection - The selected section ID from the sidebar menu
 * @returns Array of preview sections to display
 */
export const getSelectedSectionData = (selectedSection?: string) => {
  if (!selectedSection) return getAllPreviewSectionsFromConstants();

  const sectionMap: Record<string, string> = {
    search: "all", // Show all sections for search
    inputs: "inputs",
    "image-tools": "imageTools",
    "video-tools": "videoTools",
    "audio-tools": "audioTools",
    helpers: "helpers",
    prototype: "prototype",
  };

  const sectionKey = sectionMap[selectedSection];
  if (sectionKey === "all") {
    return getAllPreviewSectionsFromConstants();
  }

  const section = PREVIEW_NODES[sectionKey as keyof typeof PREVIEW_NODES];
  return section ? [section] : getAllPreviewSectionsFromConstants();
};

/**
 * Maps sidebar menu IDs to section titles for scrolling
 * @param sidebarMenuId - The sidebar menu item ID
 * @returns The corresponding section title, or empty string for search (scroll to top)
 */
export const getSectionTitleForScroll = (sidebarMenuId?: string): string => {
  if (!sidebarMenuId) return "";

  const sectionTitleMap: Record<string, string> = {
    search: "", // Scroll to top for search
    inputs: "Inputs",
    "image-tools": "Image tools",
    "video-tools": "Video tools",
    "audio-tools": "Audio Tools",
    helpers: "Helpers",
    prototype: "Prototype",
  };

  return sectionTitleMap[sidebarMenuId] ?? "";
};

// Search utility for filtering tools
export function searchTools(sections: any[], searchTerm: string) {
  if (!searchTerm.trim()) {
    return sections;
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();

  return sections
    .map((section: any) => {
      const filteredNodes = section.nodes.filter((node: any) =>
        node.title.toLowerCase().includes(normalizedSearch)
      );

      // Only return section if it has matching tools
      return filteredNodes.length > 0
        ? {
            ...section,
            nodes: filteredNodes,
          }
        : null;
    })
    .filter(Boolean);
}
