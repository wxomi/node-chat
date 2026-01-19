type SelectItem = {
  value: string;
  label: string;
};

export const ANIMATION_DEFAULTS = {
  width: 512,
  height: 960,
  fps: 12,
  endSeconds: 15,
  transitionSpeed: 5,
};

export const FPS_CONFIG = { min: 1, max: 30, step: 1 };
export const END_SECONDS_CONFIG = { min: 0, max: 60, step: 1 };
export const TRANSITION_SPEED_CONFIG = { min: 1, max: 10, step: 1 };

export const ART_STYLE_OPTIONS: SelectItem[] = [
  { value: "Custom", label: "Custom" },
  { value: "Painterly Illustration", label: "Painterly Illustration" },
  { value: "Vibrant Matte Illustration", label: "Vibrant Matte Illustration" },
  { value: "Traditional Watercolor", label: "Traditional Watercolor" },
  { value: "Cyberpunk", label: "Cyberpunk" },
  {
    value: "Ink and Watercolor Portrait",
    label: "Ink and Watercolor Portrait",
  },
  {
    value: "Intricate Abstract Lines Portrait",
    label: "Intricate Abstract Lines Portrait",
  },
  { value: "3D Render", label: "3D Render" },
  { value: "Old School Comic", label: "Old School Comic" },
  { value: "Bold Colored Illustration", label: "Bold Colored Illustration" },
  { value: "Synthwave", label: "Synthwave" },
  { value: "Minimal Cold Futurism", label: "Minimal Cold Futurism" },
  { value: "Futuristic Anime", label: "Futuristic Anime" },
  { value: "Cinematic Miyazaki", label: "Cinematic Miyazaki" },
  { value: "Studio Ghibli Film Still", label: "Studio Ghibli Film Still" },
  {
    value: "Soft Delicate Matte Portrait",
    label: "Soft Delicate Matte Portrait",
  },
  { value: "Cinematic Landscape", label: "Cinematic Landscape" },
  { value: "Landscape Painting", label: "Landscape Painting" },
  { value: "Photograph", label: "Photograph" },
  { value: "Jackson Pollock", label: "Jackson Pollock" },
  { value: "Cubist", label: "Cubist" },
  { value: "Abstract Minimalist", label: "Abstract Minimalist" },
  { value: "Impressionism", label: "Impressionism" },
  { value: "Van Gogh", label: "Van Gogh" },
  { value: "Woodcut", label: "Woodcut" },
  { value: "Oil Painting", label: "Oil Painting" },
  { value: "Vintage Japanese Anime", label: "Vintage Japanese Anime" },
  { value: "Pixar", label: "Pixar" },
  { value: "Cosmic", label: "Cosmic" },
  { value: "Pixel Art", label: "Pixel Art" },
  { value: "Fantasy", label: "Fantasy" },
  { value: "Arcane", label: "Arcane" },
  { value: "Sin City", label: "Sin City" },
  { value: "Double Exposure", label: "Double Exposure" },
  { value: "Painted Cityscape", label: "Painted Cityscape" },
  { value: "90s Streets", label: "90s Streets" },
  { value: "Overgrown", label: "Overgrown" },
  { value: "Postapocalyptic", label: "Postapocalyptic" },
  { value: "Spooky", label: "Spooky" },
  { value: "Miniatures", label: "Miniatures" },
  { value: "Low Poly", label: "Low Poly" },
  { value: "Art Deco", label: "Art Deco" },
  { value: "Inkpunk", label: "Inkpunk" },
  { value: "Dark Graphic Illustration", label: "Dark Graphic Illustration" },
  { value: "Dark Watercolor", label: "Dark Watercolor" },
  { value: "Faded Illustration", label: "Faded Illustration" },
  { value: "Directed by AI", label: "Directed by AI" },
];

export const CAMERA_EFFECT_OPTIONS: SelectItem[] = [
  { value: "Simple Zoom Out", label: "Simple Zoom Out" },
  { value: "Simple Zoom In", label: "Simple Zoom In" },
  { value: "Bounce Out", label: "Bounce Out" },
  { value: "Spin Bounce", label: "Spin Bounce" },
  { value: "Rolling Bounces", label: "Rolling Bounces" },
  { value: "Rise and Climb", label: "Rise and Climb" },
  { value: "Dramatic Zoom In", label: "Dramatic Zoom In" },
  { value: "Dramatic Zoom Out", label: "Dramatic Zoom Out" },
  { value: "Sway Out", label: "Sway Out" },
  { value: "Boost Zoom In", label: "Boost Zoom In" },
  { value: "Boost Zoom Out", label: "Boost Zoom Out" },
  { value: "Heartbeat", label: "Heartbeat" },
  { value: "Bounce in Place", label: "Bounce in Place" },
  { value: "Earthquake Bounce", label: "Earthquake Bounce" },
  { value: "Slice Bounce", label: "Slice Bounce" },
  { value: "Bounce In And Out", label: "Bounce In And Out" },
  { value: "Jump", label: "Jump" },
  { value: "Road Trip", label: "Road Trip" },
  { value: "Traverse", label: "Traverse" },
  { value: "Rubber Band", label: "Rubber Band" },
  { value: "Rodeo", label: "Rodeo" },
  { value: "Accelerate", label: "Accelerate" },
  { value: "Speed of Light", label: "Speed of Light" },
  { value: "Drift Spin", label: "Drift Spin" },
  { value: "Vertigo", label: "Vertigo" },
  { value: "Cog in the Machine", label: "Cog in the Machine" },
  { value: "Quadrant", label: "Quadrant" },
  { value: "Tron", label: "Tron" },
  { value: "Pusher", label: "Pusher" },
  { value: "Roll In", label: "Roll In" },
  { value: "Hesitate In", label: "Hesitate In" },
  { value: "Zoom In - Audio Sync", label: "Zoom In - Audio Sync" },
  { value: "Pulse - Audio Sync", label: "Pulse - Audio Sync" },
  {
    value: "Aggressive Zoom In - Audio Sync",
    label: "Aggressive Zoom In - Audio Sync",
  },
  { value: "Roll In - Audio Sync", label: "Roll In - Audio Sync" },
  { value: "Zoom Out - Audio Sync", label: "Zoom Out - Audio Sync" },
  {
    value: "Aggressive Zoom Out - Audio Sync",
    label: "Aggressive Zoom Out - Audio Sync",
  },
  { value: "Sway Out - Audio Sync", label: "Sway Out - Audio Sync" },
  {
    value: "Bounce and Spin - Audio Sync",
    label: "Bounce and Spin - Audio Sync",
  },
  {
    value: "Zoom In and Spin - Audio Sync",
    label: "Zoom In and Spin - Audio Sync",
  },
  { value: "Vertigo - Audio Sync", label: "Vertigo - Audio Sync" },
  { value: "Bounce Out - Audio Sync", label: "Bounce Out - Audio Sync" },
  {
    value: "Earthquake Bounce - Audio Sync",
    label: "Earthquake Bounce - Audio Sync",
  },
  { value: "Pusher - Audio Sync", label: "Pusher - Audio Sync" },
  { value: "Evolve - Audio Sync", label: "Evolve - Audio Sync" },
  { value: "Devolve - Audio Sync", label: "Devolve - Audio Sync" },
  { value: "Slideshow", label: "Slideshow" },
  { value: "Pan Left", label: "Pan Left" },
  { value: "Pan Right", label: "Pan Right" },
  { value: "Tilt Up", label: "Tilt Up" },
  { value: "Tilt Down", label: "Tilt Down" },
  { value: "Directed by AI", label: "Directed by AI" },
];

export const PROMPT_TYPE_OPTIONS: SelectItem[] = [
  { value: "custom", label: "Custom" },
  { value: "use_lyrics", label: "Use Lyrics" },
  { value: "ai_choose", label: "AI Choose" },
];

export const AUDIO_SOURCE_OPTIONS: SelectItem[] = [
  { value: "file", label: "File" },
  { value: "youtube", label: "YouTube" },
  { value: "none", label: "None" },
];
