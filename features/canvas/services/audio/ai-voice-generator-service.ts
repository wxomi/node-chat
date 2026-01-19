import { AIVoiceGeneratorConfig } from "../../validations/audio";
import { useApiCall } from "../../hooks/use-api-call";

type GenerateVoiceResponse = {
  id: string;
  credits_charged: number;
};

export const generateVoice = async (
  config: AIVoiceGeneratorConfig
): Promise<GenerateVoiceResponse> => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: "https://api.magichour.ai/v1/ai-voice-generator",
    method: "POST",
    data: {
      name: config.name || `AI Voice Generator - ${new Date().toISOString()}`,
      style: {
        prompt: config.prompt,
        voice_name: config.voiceName,
      },
    },
  });
};

export const getAudioDetails = async (audioId: string) => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: `https://api.magichour.ai/v1/audio-projects/${audioId}`,
    method: "GET",
  });
};
