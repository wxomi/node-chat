import { z } from "zod";

// Zod schema for face mappings (shared between image and video face swap)
export const faceMappingSchema = z.object({
  original_face: z.string().min(1, "Original face path is required"),
  new_face: z.string().min(1, "New face path is required"),
});

// Infer the TypeScript type from the schema
export type FaceMapping = z.infer<typeof faceMappingSchema>;

