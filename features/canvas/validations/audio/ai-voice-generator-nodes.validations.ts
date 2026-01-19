import { z } from "zod";

// Supported voice names from Magic Hour API
const VOICE_NAMES = [
  "Elon Musk",
  "Mark Zuckerberg",
  "Joe Rogan",
  "Barack Obama",
  "Morgan Freeman",
  "Kanye West",
  "Donald Trump",
  "Joe Biden",
  "Kim Kardashian",
  "Taylor Swift",
] as const;

// Extract the voice name type from VOICE_NAMES
export type VoiceName = (typeof VOICE_NAMES)[number];

// Zod schema for audio data structure from Magic Hour API
const audioSchema = z.object({
  url: z.string().url(),
  expires_at: z.string(),
});

// Zod schema for AI Voice Generator configuration
export const aiVoiceGeneratorConfigSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  voiceName: z.enum(VOICE_NAMES).default("Elon Musk"),
  name: z.string().optional(),
});

// Zod schema for AI Voice Generator node config (used in config store)
export const aiVoiceGeneratorNodeConfigSchema = z.object({
  prompt: z.string().default(""),
  voiceName: z.enum(VOICE_NAMES).default("Elon Musk"),
  name: z.string().optional(),
});

// Zod schema for AI Voice Generator node data
export const aiVoiceGeneratorNodeDataSchema = z.object({
  generatedAudioId: z.string().optional(),
  creditsCharged: z.number().optional(),
  audioDetails: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      status: z.enum([
        "draft",
        "queued",
        "rendering",
        "complete",
        "error",
        "canceled",
      ]),
      type: z.string(),
      created_at: z.string(),
      enabled: z.boolean(),
      credits_charged: z.number(),
      downloads: z.array(audioSchema),
      error: z
        .object({
          message: z.string(),
          code: z.string(),
        })
        .nullable(),
    })
    .optional(),
});

// Infer the TypeScript types from the schemas
export type AudioData = z.infer<typeof audioSchema>;
export type AIVoiceGeneratorConfig = z.infer<
  typeof aiVoiceGeneratorConfigSchema
>;
export type AIVoiceGeneratorNodeConfig = z.infer<
  typeof aiVoiceGeneratorNodeConfigSchema
>;
export type AIVoiceGeneratorNodeData = z.infer<
  typeof aiVoiceGeneratorNodeDataSchema
>;

// Validation functions for config
export const validateAIVoiceGeneratorConfig = (
  data: unknown
): AIVoiceGeneratorConfig => {
  return aiVoiceGeneratorConfigSchema.parse(data);
};

export const safeValidateAIVoiceGeneratorConfig = (data: unknown) => {
  return aiVoiceGeneratorConfigSchema.safeParse(data);
};

// Validation functions for node data
export const validateAIVoiceGeneratorNodeData = (
  data: unknown
): AIVoiceGeneratorNodeData => {
  return aiVoiceGeneratorNodeDataSchema.parse(data);
};

export const safeValidateAIVoiceGeneratorNodeData = (data: unknown) => {
  return aiVoiceGeneratorNodeDataSchema.safeParse(data);
};
