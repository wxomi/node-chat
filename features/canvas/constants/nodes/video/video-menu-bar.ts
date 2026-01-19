import { CloseIcon, DownloadIcon } from "@/constants/icons";
import { StaticImageData } from "next/image";

export type VideoMenuBarItem = {
  id: string;
  tooltip: string;
  icon?: StaticImageData;
  isIconFromLucide?: boolean;
  label?: string;
  action: "close" | "download" | "copy";
};

export const VIDEO_MENU_BAR_ITEMS: VideoMenuBarItem[] = [
  {
    id: "close",
    tooltip: "Close",
    icon: CloseIcon,
    action: "close",
  },
  {
    id: "download",
    tooltip: "Download Video",
    icon: DownloadIcon,
    action: "download",
  },
  {
    id: "copy",
    tooltip: "Copy Link",
    isIconFromLucide: true,
    label: "Copy Link",
    action: "copy",
  },
];
