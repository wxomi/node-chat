type SelectItem = {
  value: string;
  label: string;
};

export const END_SECONDS_CONFIG = {
  min: 5,
  max: 60,
  step: 5,
};

export const RESOLUTION_OPTIONS: SelectItem[] = [
  { value: "480p", label: "480p (120 credits)" },
  { value: "720p", label: "720p (300 credits)" },
  { value: "1080p", label: "1080p (600 credits)" },
];

export const ORIENTATION_OPTIONS: SelectItem[] = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
  { value: "square", label: "Square" },
];

export const ART_STYLE_OPTIONS: SelectItem[] = [
  { value: "Minecraft", label: "Minecraft" },
  { value: "Watercolor", label: "Watercolor" },
  { value: "Lego", label: "Lego" },
  { value: "GTA", label: "GTA" },
  { value: "Clay", label: "Clay" },
  { value: "Retro Sci-Fi", label: "Retro Sci-Fi" },
  { value: "Pixel", label: "Pixel" },
  { value: "Origami", label: "Origami" },
  { value: "Ghost", label: "Ghost" },
  { value: "Underwater", label: "Underwater" },
  { value: "Cyberpunk", label: "Cyberpunk" },
  { value: "Sub-Zero", label: "Sub-Zero" },
  { value: "Studio Ghibli", label: "Studio Ghibli" },
  { value: "Impressionism", label: "Impressionism" },
  { value: "Master Chief", label: "Master Chief" },
  { value: "Solid Snake", label: "Solid Snake" },
  { value: "Street Fighter", label: "Street Fighter" },
  { value: "Hologram", label: "Hologram" },
  { value: "Mystique", label: "Mystique" },
  { value: "3D Render", label: "3D Render" },
  { value: "Airbender", label: "Airbender" },
  { value: "Android", label: "Android" },
  { value: "Anime Warrior", label: "Anime Warrior" },
  { value: "Armored Knight", label: "Armored Knight" },
  { value: "Assassin's Creed", label: "Assassin's Creed" },
  { value: "Avatar", label: "Avatar" },
  { value: "Black Spiderman", label: "Black Spiderman" },
  { value: "Boba Fett", label: "Boba Fett" },
  { value: "Celestial Skin", label: "Celestial Skin" },
  { value: "Chinese Swordsmen", label: "Chinese Swordsmen" },
  { value: "Comic", label: "Comic" },
  { value: "Cypher", label: "Cypher" },
  { value: "Dark Fantasy", label: "Dark Fantasy" },
  { value: "Dragonball Z", label: "Dragonball Z" },
  { value: "Future Bot", label: "Future Bot" },
  { value: "Futuristic Fantasy", label: "Futuristic Fantasy" },
  { value: "Gundam", label: "Gundam" },
  { value: "Illustration", label: "Illustration" },
  { value: "Ink", label: "Ink" },
  { value: "Ink Poster", label: "Ink Poster" },
  { value: "Jinx", label: "Jinx" },
  { value: "Knight", label: "Knight" },
  { value: "Link", label: "Link" },
  { value: "Marble", label: "Marble" },
  { value: "Mario", label: "Mario" },
  { value: "Mech", label: "Mech" },
  { value: "Naruto", label: "Naruto" },
  { value: "Neon Dream", label: "Neon Dream" },
  { value: "No Art Style", label: "No Art Style" },
  { value: "Oil Painting", label: "Oil Painting" },
  { value: "On Fire", label: "On Fire" },
  { value: "Pixar", label: "Pixar" },
  { value: "Power Armor", label: "Power Armor" },
  { value: "Power Ranger", label: "Power Ranger" },
  { value: "Retro Anime", label: "Retro Anime" },
  { value: "Samurai", label: "Samurai" },
  { value: "Samurai Bot", label: "Samurai Bot" },
  { value: "Spartan", label: "Spartan" },
  { value: "Starfield", label: "Starfield" },
  { value: "The Void", label: "The Void" },
  { value: "Tomb Raider", label: "Tomb Raider" },
  { value: "Van Gogh", label: "Van Gogh" },
  { value: "Viking", label: "Viking" },
  { value: "Wu Kong", label: "Wu Kong" },
  { value: "Zelda", label: "Zelda" },
  { value: "Painterly Anime", label: "Painterly Anime" },
  { value: "Realistic Anime", label: "Realistic Anime" },
  { value: "Bold Anime", label: "Bold Anime" },
  { value: "Wuxia Anime", label: "Wuxia Anime" },
  { value: "Soft Anime", label: "Soft Anime" },
  { value: "Radiant Anime", label: "Radiant Anime" },
  { value: "Sharp Anime", label: "Sharp Anime" },
  { value: "Ghibli Anime", label: "Ghibli Anime" },
];

export const VERSION_OPTIONS: SelectItem[] = [
  { value: "v1", label: "V1 (More detail, closer prompt adherence)" },
  { value: "v2", label: "V2 (Faster, more consistent)" },
  { value: "default", label: "Default (Recommended for style)" },
];

export const PROMPT_TYPE_OPTIONS: SelectItem[] = [
  { value: "default", label: "Default (Use recommended prompt)" },
  { value: "custom", label: "Custom (Only use your prompt)" },
  { value: "append_default", label: "Append Default (Add recommended prompt)" },
];

export const MODEL_OPTIONS: SelectItem[] = [
  { value: "Dreamshaper", label: "Dreamshaper (All-around model)" },
  { value: "Absolute Reality", label: "Absolute Reality (Better realism)" },
  { value: "Flat 2D Anime", label: "Flat 2D Anime (Flat illustration)" },
  { value: "Soft Anime", label: "Soft Anime" },
  { value: "Kaywaii", label: "Kaywaii" },
  { value: "default", label: "Default (Recommended for style)" },
];

export const FPS_RESOLUTION_OPTIONS: SelectItem[] = [
  { value: "FULL", label: "Full (Same FPS as input)" },
  { value: "HALF", label: "Half (Half FPS of input)" },
];

export const TRIM_CONFIG = {
  startSeconds: { min: 0, max: 300, step: 1 },
  endSeconds: { min: 1, max: 300, step: 1 },
};
