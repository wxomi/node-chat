import type { CanvasSaveData } from "../../types/canvas.types";
import { safeValidateCanvasSaveData } from "../../validations/canvas";

/**
 * Save canvas to database
 * TODO: Backend - Implement actual API mutation here
 *
 * Expected behavior:
 * - Should accept CanvasSaveData as parameter
 * - Should return Promise<void>
 * - Should handle errors appropriately
 *
 * Example implementation:
 * ```typescript
 * export const saveCanvasToDatabase = async (
 *   data: CanvasSaveData
 * ): Promise<void> => {
 *   const apiKey = process.env.NEXT_PUBLIC_MAGIC_HOUR_API_KEY;
 *   if (!apiKey) {
 *     throw new Error("Magic Hour API key is not configured");
 *   }
 *
 *   const response = await fetch('/api/canvas/save', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${apiKey}`,
 *     },
 *     body: JSON.stringify(data),
 *   });
 *
 *   if (!response.ok) {
 *     const errorData = await response.json().catch(() => ({}));
 *     throw new Error(errorData.message || `API request failed with status ${response.status}`);
 *   }
 * };
 * ```
 */
export const saveCanvasToDatabase = async (
  data: CanvasSaveData
): Promise<void> => {
  // TODO: Backend - Replace this simulation with actual API call
  // Simulation code for testing (remove when backend is ready)

  const canvasId = data.id || "new-canvas";
  const projectName = data.name || "Untitled";
  const nodeCount = data.graphIndex?.nodes?.length || 0;
  const edgeCount = data.graphIndex?.edges?.length || 0;

  console.log("[Canvas Service] Saving canvas:", {
    canvasId,
    projectName,
    nodeCount,
    edgeCount,
    updatedAt: data.updatedAt,
  });

  // Simulate network delay (100-300ms)
  const delay = Math.random() * 200 + 100;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Simulate occasional failures for testing (5% failure rate)
  if (Math.random() < 0.05) {
    console.error("[Canvas Service] Save failed for canvas:", canvasId);
    throw new Error("Simulated network error");
  }

  console.log("[Canvas Service] Canvas saved successfully:", canvasId);
};

/**
 * Load canvas from database
 * TODO: Backend - Implement actual API call here
 *
 * Expected behavior:
 * - Should accept canvasId as parameter
 * - Should return Promise<CanvasSaveData | null>
 * - Should return null if canvas not found or ID doesn't match
 * - Should handle errors appropriately
 *
 * Example implementation:
 * ```typescript
 * export const loadCanvasFromDatabase = async (
 *   canvasId: string
 * ): Promise<CanvasSaveData | null> => {
 *   const apiKey = process.env.NEXT_PUBLIC_MAGIC_HOUR_API_KEY;
 *   if (!apiKey) {
 *     throw new Error("Magic Hour API key is not configured");
 *   }
 *
 *   const response = await fetch(`/api/canvas/${canvasId}`, {
 *     method: 'GET',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${apiKey}`,
 *     },
 *   });
 *
 *   if (!response.ok) {
 *     if (response.status === 404) {
 *       return null;
 *     }
 *     const errorData = await response.json().catch(() => ({}));
 *     throw new Error(errorData.message || `API request failed with status ${response.status}`);
 *   }
 *
 *   return response.json();
 * };
 * ```
 */
export const loadCanvasFromDatabase = async (
  canvasId: string
): Promise<CanvasSaveData | null> => {
  // TODO: Backend - Replace this simulation with actual API call

  console.log("[Canvas Service] Loading canvas:", canvasId);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Dummy payload based on logged canvas state
  const dummyPayload: CanvasSaveData = {
    id: "123",
    name: "dummy-project",
    graphIndex: {
      nodes: [
        {
          id: "y8s1ZCX37AAYNsJR-PAeJ",
          type: "text-node",
          position: {
            x: 694.9071164510166,
            y: 384.3792975970425,
          },
          data: {
            prompt:
              "Epic anime art of wizard casting a cosmic spell in the sky that says 'Magic Hour'.",
            flowConfig: {
              inputs: [],
              outputs: [
                {
                  id: "prompt-output",
                  type: "source",
                  dataType: "string",
                  label: "Prompt",
                  position: "right",
                  required: true,
                },
              ],
            },
            configOptions: false,
          },
          measured: {
            width: 420,
            height: 233,
          },
        },
        {
          id: "mZAzJI7oaE9ZAF64NiCrn",
          type: "image-generator-node",
          position: {
            x: 1389.3039267302522,
            y: 504.30775384978483,
          },
          data: {
            flowConfig: {
              inputs: [
                {
                  id: "prompt-input",
                  type: "target",
                  dataType: "string",
                  label: "Prompt",
                  position: "left",
                  required: true,
                  maxConnections: 1,
                },
              ],
              outputs: [
                {
                  id: "image-output",
                  type: "source",
                  dataType: "image",
                  label: "Image",
                  position: "right",
                },
              ],
            },
            configOptions: true,
            generatedImageId: "cmhthast5001e150ze8a8f49w",
            creditsCharged: 5,
            imageDetails: {
              id: "cmhthast5001e150ze8a8f49w",
              name: "AI Image - 2025-11-10T18:31:25.972Z",
              status: "complete",
              image_count: 1,
              type: "AI_IMAGE",
              created_at: "2025-11-10T18:31:26.297Z",
              enabled: true,
              total_frame_cost: 5,
              credits_charged: 5,
              downloads: [
                {
                  url: "https://videos.magichour.ai/cmhthast5001e150ze8a8f49w/output-1.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=web-service%40magic-hour-385504.iam.gserviceaccount.com%2F20251110%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20251110T183129Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=47282334a78d789261ae83261a2d05c8a6e59f90bc2f93b346a470dde07b9f2cdee5a83f9fb628e74dfe1ceaaf63334952cbc86fbf51e8605594d695bfa2caadcca44b88b94cae6da4f613008bb581cacf4ca4992babf70bc9f648b65143bac3a87d32137c407569ec30426377939737798a5bef0df33d91471e02c3990be68a525a939ff6095fc5aa925d2d7ea35abd4a457521d705b9b86760cb2046e79372279ac23dab781b9dca058da54633fd8af8d1d370e72c4f81a51e93d8074f3c539d2c3756334931891d94b0b33c58a5925c2235db5864ff007b60e68f52dd2485842414e44b8b3a81670a878089bbea4eb5bede371737ce1e66042ca7eb90a60b",
                  expires_at: "2025-11-11T18:31:29.347Z",
                },
              ],
              error: null,
            },
          },
          measured: {
            width: 420,
            height: 509,
          },
        },
        {
          id: "i8P-qSU5N9Ey7hbRzz8gh",
          type: "video-generator-node",
          position: {
            x: 2189.303926730252,
            y: 804.3077538497848,
          },
          data: {
            flowConfig: {
              inputs: [
                {
                  id: "prompt-input",
                  type: "target",
                  dataType: "string",
                  label: "Prompt",
                  position: "left",
                  maxConnections: 1,
                },
                {
                  id: "image-input",
                  type: "target",
                  dataType: "image",
                  label: "Image",
                  position: "left",
                  required: true,
                  maxConnections: 1,
                },
                {
                  id: "video-input",
                  type: "target",
                  dataType: "video",
                  label: "Video",
                  position: "left",
                  required: true,
                  maxConnections: 1,
                },
              ],
              outputs: [
                {
                  id: "video-output",
                  type: "source",
                  dataType: "video",
                  label: "Video",
                  position: "right",
                },
              ],
            },
            configOptions: true,
          },
          measured: {
            width: 500,
            height: 409,
          },
        },
        {
          id: "eYh5h8635h0nWPJ1sAAaN",
          type: "ai-image-upscaler-node",
          position: {
            x: 1944.2992132750114,
            y: -43.92720148270074,
          },
          data: {
            flowConfig: {
              inputs: [
                {
                  id: "image-input",
                  type: "target",
                  dataType: "image",
                  label: "Image",
                  position: "left",
                  required: true,
                  maxConnections: 1,
                },
              ],
              outputs: [
                {
                  id: "image-output",
                  type: "source",
                  dataType: "image",
                  label: "Image",
                  position: "right",
                },
              ],
            },
            configOptions: true,
            generatedImageId: "cmhthbe5n0030330z6dziakw2",
            creditsCharged: 50,
            imageDetails: {
              id: "cmhthbe5n0030330z6dziakw2",
              name: "Image Upscaler - 2025-11-10T18:31:53.750Z",
              status: "complete",
              image_count: 1,
              type: "IMAGE_UPSCALER",
              created_at: "2025-11-10T18:31:53.963Z",
              enabled: true,
              total_frame_cost: 50,
              credits_charged: 50,
              downloads: [
                {
                  url: "https://videos.magichour.ai/cmhthbe5n0030330z6dziakw2/output.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=web-service%40magic-hour-385504.iam.gserviceaccount.com%2F20251110%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20251110T183202Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=b6a0dfda4ca2533fbc1161e075090d37332add77b2e23a633e4bd5cdf769c9a2c71db8b784db3bf1e80e9400ff1ce5464ffd2751ef500a78d1a3be27f99ef8d59d40085f2d2b90530bd101ea22cbfd1b5320897a66cbae2b8fe6aab1b129033a1261bb592d94ca9ef4402e8f213514774856a6cd516c243e80d177efb03118091e307cca399de59a08bf59ca6dbcf97cc0838201ed6be61f68fdfda430ced9bdd7af7411517b412a431e7ecdcfb74f42b8a9d8c9b6ba0d0c7e57ab69be0b0aa47f68373cab21cc97d80ff471e619514906ffc4179239a1d2b7d2f40b628d4ae302321c7f47d749d6ea9023aa9b8bf9987d13cdab4fc27df314bff27798f45734",
                  expires_at: "2025-11-11T18:32:02.773Z",
                },
              ],
              error: null,
            },
          },
          measured: {
            width: 420,
            height: 509,
          },
          selected: false,
        },
        {
          id: "ZcJOILGZsMbnajpmCHQEm",
          type: "ai-image-upscaler-node",
          position: {
            x: 2463.950241756326,
            y: 21.029177077463565,
          },
          data: {
            flowConfig: {
              inputs: [
                {
                  id: "image-input",
                  type: "target",
                  dataType: "image",
                  label: "Image",
                  position: "left",
                  required: true,
                  maxConnections: 1,
                },
              ],
              outputs: [
                {
                  id: "image-output",
                  type: "source",
                  dataType: "image",
                  label: "Image",
                  position: "right",
                },
              ],
            },
            configOptions: true,
            generatedImageId: "cmhthbfe4001n150zpnpt8uhd",
            creditsCharged: 50,
            imageDetails: {
              id: "cmhthbfe4001n150zpnpt8uhd",
              name: "Image Upscaler - 2025-11-10T18:31:55.150Z",
              status: "complete",
              image_count: 1,
              type: "IMAGE_UPSCALER",
              created_at: "2025-11-10T18:31:55.564Z",
              enabled: true,
              total_frame_cost: 50,
              credits_charged: 50,
              downloads: [
                {
                  url: "https://videos.magichour.ai/cmhthbfe4001n150zpnpt8uhd/output.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=web-service%40magic-hour-385504.iam.gserviceaccount.com%2F20251110%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20251110T183210Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=4110d534c31376ee69e801ddb352c26672c6ba23d4ee8e0df3f4e01cc6a9db4387448c1221c9322ad650031600d2631a02f9ddd6ba8e8545e2808e5f36f75f2e1c71fab9ddc47f8f0f3ed3c0c46d27b315c4328bae2392abf16f18a39e9de75358e3f7421235b8793bb9125b3310a62031603450ade92e2b3da940ad2fda0dd8978e9e2674dad2fbe88822d3aa88e883517bfa51371dcac9c51d9ea1dfd261b8ae3d64b05c2707ca5244c9b5358e7513bc38bb193736dc1267f0934e861c3f6c61f562b0b0b11241ebf2fb7d704ab9656dae1b86da9f73b9599b994706c9009bfb97f1062c209d448a85bb6092837c2f1c1d4c913426782753e04506a2818385",
                  expires_at: "2025-11-11T18:32:10.298Z",
                },
              ],
              error: null,
            },
          },
          measured: {
            width: 420,
            height: 509,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "YH8t3l0PkLW7HHQloA3MM",
          type: "ai-image-editor-node",
          position: {
            x: 2018.9841927547855,
            y: 1334.976130944959,
          },
          data: {
            flowConfig: {
              inputs: [
                {
                  id: "image-input",
                  type: "target",
                  dataType: "image",
                  label: "Image",
                  position: "left",
                  required: true,
                  maxConnections: 1,
                },
                {
                  id: "prompt-input",
                  type: "target",
                  dataType: "string",
                  label: "Prompt",
                  position: "left",
                  required: true,
                  maxConnections: 1,
                },
              ],
              outputs: [
                {
                  id: "image-output",
                  type: "source",
                  dataType: "image",
                  label: "Image",
                  position: "right",
                },
              ],
            },
            configOptions: true,
            generatedImageId: "cmhthbvj8001q150z7ndsof4i",
            creditsCharged: 50,
            imageDetails: {
              id: "cmhthbvj8001q150z7ndsof4i",
              name: "AI Image Editor - 2025-11-10T18:32:16.267Z",
              status: "complete",
              image_count: 1,
              type: "AI_IMAGE_EDITOR",
              created_at: "2025-11-10T18:32:16.484Z",
              enabled: true,
              total_frame_cost: 50,
              credits_charged: 50,
              downloads: [
                {
                  url: "https://videos.magichour.ai/cmhthbvj8001q150z7ndsof4i/output.png?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=web-service%40magic-hour-385504.iam.gserviceaccount.com%2F20251110%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20251110T183242Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=7ac76355c459271eb078ae35dae6c0f74891c90b49f31bc911ea878276daae8eff135de6fe32980676c91c8e5cf384c7d8b3e18a1c562cbdf3b4e8e840567fe5477dd73f0175018f6169cb5439c1eb7e26adde62d9c60eabceddab2ecf68c1bb928d58366cf9eec68bb620d743543e658e5364eb3c279bb6b00f314716b5f61a2182c96c35be196a466672ceca67d141e72bc0f55d79e55eadd3c9cb3131f5c3ff8eabdfcd53234e1d378d947a2dbda7c5c484057db100df3da6d1126a6feb4c610eb3b4de786266d4776f21732f6438345494d309dd9862469caee750fe8e2f5c45c3a31f81e48869172c14f9e1c9652c0ba3834a78fb5075b0aad692977db",
                  expires_at: "2025-11-11T18:32:42.138Z",
                },
              ],
              error: null,
            },
          },
          measured: {
            width: 420,
            height: 509,
          },
          selected: false,
        },
        {
          id: "4o0Cpp8MdAMfIGcEUDxK5",
          type: "text-node",
          position: {
            x: 1204.9841927547855,
            y: 1760.976130944959,
          },
          data: {
            flowConfig: {
              inputs: [],
              outputs: [
                {
                  id: "prompt-output",
                  type: "source",
                  dataType: "string",
                  label: "Prompt",
                  position: "right",
                  required: true,
                },
              ],
            },
            configOptions: false,
            prompt: "Turn this wizard and image pixelated",
          },
          measured: {
            width: 420,
            height: 233,
          },
          selected: false,
        },
        {
          id: "a-BaVw3I9LiyJYQQx-4PB",
          type: "lip-sync-node",
          position: {
            x: 0,
            y: 0,
          },
          data: {
            flowConfig: {
              inputs: [],
              outputs: [],
            },
            configOptions: true,
          },
        },
      ],
      edges: [
        {
          id: "EavHpglb2ixTqdh7CmrfN",
          source: "y8s1ZCX37AAYNsJR-PAeJ",
          target: "mZAzJI7oaE9ZAF64NiCrn",
          sourceHandle: "prompt-output",
          targetHandle: "prompt-input",
          type: "custom-edge",
          updatable: true,
        },
        {
          id: "9BH-ggLdWoKB7sTFFx8_w",
          source: "mZAzJI7oaE9ZAF64NiCrn",
          target: "i8P-qSU5N9Ey7hbRzz8gh",
          sourceHandle: "image-output",
          targetHandle: "image-input",
          type: "custom-edge",
          updatable: true,
        },
        {
          id: "yB-mB5BTAWP6tnEDZgOwj",
          source: "mZAzJI7oaE9ZAF64NiCrn",
          target: "eYh5h8635h0nWPJ1sAAaN",
          sourceHandle: "image-output",
          targetHandle: "image-input",
          type: "custom-edge",
          updatable: true,
        },
        {
          id: "ad_vIfw4aJeA-E-V3NaQM",
          source: "mZAzJI7oaE9ZAF64NiCrn",
          target: "ZcJOILGZsMbnajpmCHQEm",
          sourceHandle: "image-output",
          targetHandle: "image-input",
          type: "custom-edge",
          updatable: true,
        },
        {
          id: "PCq5iuIpR1ANNpOC5je7H",
          source: "mZAzJI7oaE9ZAF64NiCrn",
          target: "YH8t3l0PkLW7HHQloA3MM",
          sourceHandle: "image-output",
          targetHandle: "image-input",
          type: "custom-edge",
          updatable: true,
        },
        {
          id: "RC6b94PW446k8xcAq_drQ",
          source: "4o0Cpp8MdAMfIGcEUDxK5",
          target: "YH8t3l0PkLW7HHQloA3MM",
          sourceHandle: "prompt-output",
          targetHandle: "prompt-input",
          type: "custom-edge",
          updatable: true,
        },
      ],
      viewport: {
        x: -82.01183009502392,
        y: 165.3154007674509,
        zoom: 0.5,
      },
    },
    walkthrough: false,
    nodeConfigs: {
      mZAzJI7oaE9ZAF64NiCrn: {
        imageCount: 1,
        orientation: "square",
        style: {
          prompt: "",
          tool: "general",
        },
      },
      "i8P-qSU5N9Ey7hbRzz8gh": {
        mode: "image-to-video",
        endSeconds: 5,
        startSeconds: 0,
        resolution: "720p",
        orientation: "landscape",
        prompt: "",
        fpsResolution: "HALF",
        artStyle: "No Art Style",
        version: "default",
        promptType: "default",
        model: "default",
      },
      eYh5h8635h0nWPJ1sAAaN: {
        scaleFactor: "2",
        enhancement: "Balanced",
        prompt: "",
      },
      ZcJOILGZsMbnajpmCHQEm: {
        scaleFactor: "2",
        enhancement: "Balanced",
        prompt: "",
      },
      YH8t3l0PkLW7HHQloA3MM: {
        prompt: "",
      },
      "a-BaVw3I9LiyJYQQx-4PB": {
        startSeconds: 0,
        endSeconds: 15,
        maxFpsLimit: 12,
        style: {
          generationMode: "lite",
        },
        assets: {
          videoSource: "file",
        },
      },
    },
    updatedAt: new Date().toISOString(),
  };

  // Compare requested canvas ID with returned payload ID
  const returnedCanvasId = dummyPayload.id;
  if (canvasId !== returnedCanvasId) {
    console.warn(
      "[Canvas Service] Canvas ID mismatch:",
      `Requested: ${canvasId}, Returned: ${returnedCanvasId}`
    );
    console.log("[Canvas Service] Returning null - canvas not found");
    return null;
  }

  console.log(
    "[Canvas Service] Canvas ID verified:",
    `Requested and returned IDs match (${canvasId})`
  );

  // Validate data from backend before returning (can't trust external data)
  const validationResult = safeValidateCanvasSaveData(dummyPayload);

  if (!validationResult.success) {
    console.error(
      "[Canvas Service] Invalid canvas data received from backend",
      {
        canvasId,
        errors: validationResult.error.issues,
      }
    );
    // Return null if data is invalid (treat as canvas not found)
    return null;
  }

  const validatedPayload = validationResult.data;

  console.log("[Canvas Service] Canvas loaded successfully:", {
    canvasId: validatedPayload.id || returnedCanvasId,
    projectName: validatedPayload.name,
    nodeCount: validatedPayload.graphIndex?.nodes?.length || 0,
    edgeCount: validatedPayload.graphIndex?.edges?.length || 0,
  });

  return validatedPayload;
};

/**
 * Update canvas name only
 * Fetches the existing canvas JSON, updates only the name field, and saves it back
 * TODO: Backend - Implement actual API mutation here
 *
 * Expected behavior:
 * - Should fetch existing canvas JSON from database
 * - Should update only the `name` field in the JSON
 * - Should preserve all other fields unchanged
 * - Should return Promise<void>
 *
 * Example implementation:
 * ```typescript
 * export const updateCanvasName = async (
 *   canvasId: string,
 *   newName: string
 * ): Promise<void> => {
 *   const apiKey = process.env.NEXT_PUBLIC_MAGIC_HOUR_API_KEY;
 *   if (!apiKey) {
 *     throw new Error("Magic Hour API key is not configured");
 *   }
 *
 *   // Fetch existing canvas JSON
 *   const getResponse = await fetch(`/api/canvas/${canvasId}`, {
 *     method: 'GET',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${apiKey}`,
 *     },
 *   });
 *
 *   if (!getResponse.ok) {
 *     const errorData = await getResponse.json().catch(() => ({}));
 *     throw new Error(errorData.message || `API request failed with status ${getResponse.status}`);
 *   }
 *
 *   const existingCanvas: CanvasSaveData = await getResponse.json();
 *
 *   // Update only the name field
 *   const updatedCanvas: CanvasSaveData = {
 *     ...existingCanvas,
 *     name: newName,
 *     updatedAt: new Date().toISOString(),
 *   };
 *
 *   // Save updated JSON back to database
 *   const putResponse = await fetch(`/api/canvas/${canvasId}`, {
 *     method: 'PUT',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${apiKey}`,
 *     },
 *     body: JSON.stringify(updatedCanvas),
 *   });
 *
 *   if (!putResponse.ok) {
 *     const errorData = await putResponse.json().catch(() => ({}));
 *     throw new Error(errorData.message || `API request failed with status ${putResponse.status}`);
 *   }
 * };
 * ```
 */
export const updateCanvasName = async (
  canvasId: string,
  newName: string
): Promise<void> => {
  // TODO: Backend - Replace this simulation with actual API call

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 150));
};

/**
 * Get walkthrough status from canvas JSON
 * Fetches the canvas JSON and returns the walkthrough boolean value
 * TODO: Backend - Implement actual API call here
 *
 * Expected behavior:
 * - Should fetch canvas JSON from database
 * - Should return the `walkthrough` boolean field from the JSON
 * - Should return Promise<boolean>
 *
 * Example implementation:
 * ```typescript
 * export const getWalkthroughStatus = async (
 *   canvasId: string
 * ): Promise<boolean> => {
 *   const apiKey = process.env.NEXT_PUBLIC_MAGIC_HOUR_API_KEY;
 *   if (!apiKey) {
 *     throw new Error("Magic Hour API key is not configured");
 *   }
 *
 *   const response = await fetch(`/api/canvas/${canvasId}`, {
 *     method: 'GET',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${apiKey}`,
 *     },
 *   });
 *
 *   if (!response.ok) {
 *     const errorData = await response.json().catch(() => ({}));
 *     throw new Error(errorData.message || `API request failed with status ${response.status}`);
 *   }
 *
 *   const canvas: CanvasSaveData = await response.json();
 *   return canvas.walkthrough ?? false;
 * };
 * ```
 */
export const getWalkthroughStatus = async (
  canvasId: string
): Promise<boolean> => {
  // TODO: Backend - Replace this simulation with actual API call

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate returning false
  return false;
};

/**
 * Get user's canvas ID (one canvas per user)
 * Returns canvas ID if exists, null if user has no canvas yet
 * TODO: Backend - Implement actual API call here
 *
 * Expected behavior:
 * - Should return Promise<string | null>
 * - Should return user's canvas ID if they have one
 * - Should return null if user has no canvas yet
 *
 * Example implementation:
 * ```typescript
 * export const getUserCanvasId = async (): Promise<string | null> => {
 *   const apiKey = process.env.NEXT_PUBLIC_MAGIC_HOUR_API_KEY;
 *   if (!apiKey) {
 *     throw new Error("Magic Hour API key is not configured");
 *   }
 *
 *   const response = await fetch('/api/user/canvas', {
 *     method: 'GET',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${apiKey}`,
 *     },
 *   });
 *
 *   if (!response.ok) {
 *     const errorData = await response.json().catch(() => ({}));
 *     throw new Error(errorData.message || `API request failed with status ${response.status}`);
 *   }
 *
 *   const result: { canvasId: string | null } = await response.json();
 *   return result.canvasId;
 * };
 * ```
 */
export const getUserCanvasId = async (): Promise<string | null> => {
  // TODO: Backend - Replace this simulation with actual API call

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate: user has no canvas yet (returns null to create new canvas)
  // When backend is ready, this will check if user has an existing canvas
  return null;
};
