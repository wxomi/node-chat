import { CloseIcon, DownloadIcon } from "@/constants/icons";
import { StaticImageData } from "next/image";

export type ImageMenuBarItem = {
  id: string;
  tooltip: string;
  icon?: StaticImageData;
  isIconFromLucide?: boolean;
  label?: string;
  action: "close" | "download" | "copy";
};

export const IMAGE_MENU_BAR_ITEMS: ImageMenuBarItem[] = [
  {
    id: "close",
    tooltip: "Close",
    icon: CloseIcon,
    action: "close",
  },
  {
    id: "download",
    tooltip: "Download Image",
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
