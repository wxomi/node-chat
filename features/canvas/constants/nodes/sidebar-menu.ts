import {
  SearchIcon,
  TextIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  MyPlanIcon,
  GridViewIcon,
  DeveloperIcon,
} from "@/constants/icons";
import { StaticImageData } from "next/image";

export type SidebarMenuItem = {
  id: string;
  label: string;
  tooltip: string;
  icon: StaticImageData;
  size: "sm" | "default" | "lg";
};

export const sidebarMenuItems: SidebarMenuItem[] = [
  {
    id: "inputs",
    label: "Inputs",
    tooltip: "Inputs",
    icon: MyPlanIcon,
    size: "lg",
  },
  {
    id: "image-tools",
    label: "Image Tools",
    tooltip: "Image Tools",
    icon: ImageIcon,
    size: "lg",
  },
  {
    id: "video-tools",
    label: "Video Tools",
    tooltip: "Video Tools",
    icon: VideoIcon,
    size: "lg",
  },
  {
    id: "audio-tools",
    label: "Audio Tools",
    tooltip: "Audio Tools",
    icon: MusicIcon,
    size: "lg",
  },
  {
    id: "helpers",
    label: "Helpers",
    tooltip: "Helpers",
    icon: GridViewIcon,
    size: "lg",
  },
  {
    id: "prototype",
    label: "Prototype",
    tooltip: "Prototype",
    icon: DeveloperIcon,
    size: "lg",
  },
];
