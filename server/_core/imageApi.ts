/**
 * AI Image Generation Service
 * Menggunakan Replicate API untuk generate gambar dari text prompt
 * Alternative: Bisa diganti dengan OpenAI, Hugging Face, atau Stability AI
 */

// Replicate API Documentation: https://replicate.com/docs/api
// Didukung: Stable Diffusion, DALL-E, Midjourney, dan banyak model lainnya

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  numOutputs?: number;
  imageSize?: "256x256" | "512x512" | "768x768";
  seed?: number;
}

export interface GeneratedImage {
  url: string;
  generatedAt: Date;
  prompt: string;
}

/**
 * Generate image using Replicate API (mock - ready for real API integration)
 * Production: Implement dengan real API calls
 */
export async function generateProductImage(
  params: ImageGenerationParams
): Promise<GeneratedImage[]> {
  // TODO: Implement dengan real Replicate API
  // const apiToken = process.env.REPLICATE_API_TOKEN;
  // if (!apiToken) {
  //   throw new Error("REPLICATE_API_TOKEN not configured");
  // }

  const {
    prompt,
    numOutputs = 1,
    imageSize = "512x512",
  } = params;

  try {
    // Mock implementation - return placeholder images
    // Production: Gunakan Replicate API client
    const generatedImages: GeneratedImage[] = [];

    for (let i = 0; i < numOutputs; i++) {
      // In production, this would be:
      // const response = await fetch("https://api.replicate.com/v1/predictions", {
      //   method: "POST",
      //   headers: {
      //     Authorization: `Token ${apiToken}`,
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     version: "model-version-id",
      //     input: {
      //       prompt,
      //       negative_prompt: negativePrompt,
      //       num_outputs: numOutputs,
      //       width: parseInt(imageSize.split("x")[0]),
      //       height: parseInt(imageSize.split("x")[1]),
      //       seed,
      //     },
      //   }),
      // });

      // Mock URL - replace dengan real generated image URL dari API
      const mockUrl = `https://via.placeholder.com/${imageSize}?text=${encodeURIComponent(prompt.substring(0, 20))}...`;

      generatedImages.push({
        url: mockUrl,
        generatedAt: new Date(),
        prompt,
      });
    }

    return generatedImages;
  } catch (error) {
    throw new Error("Failed to generate image: " + String(error), {
      cause: error,
    });
  }
}

/**
 * Generate Sambal product-specific image prompt
 */
export function generateSambalPrompt(
  productName: string,
  spiceLevel: number,
  style: string = "professional product photography"
): string {
  const spiceDescriptions: { [key: number]: string } = {
    1: "mild and subtle",
    2: "slightly spicy",
    3: "moderately spicy",
    4: "very spicy and hot",
    5: "extremely hot and fiery",
  };

  const spiceDesc = spiceDescriptions[spiceLevel] || "moderately spicy";

  return `Professional product photography of ${productName} sambal sauce, ${spiceDesc}, in a glass jar, 
  label visible, garnished with chili peppers and herbs, warm lighting, white background, 
  ${style}, high quality, detailed, appetizing`;
}

/**
 * Validate image generation prompt
 */
export function validatePrompt(prompt: string): boolean {
  if (!prompt || prompt.trim().length === 0) {
    return false;
  }
  if (prompt.length > 500) {
    return false;
  }
  // Block potentially harmful prompts
  const blockedKeywords = ["NSFW", "violent", "hateful", "illegal"];
  const lowerPrompt = prompt.toLowerCase();
  return !blockedKeywords.some(keyword =>
    lowerPrompt.includes(keyword.toLowerCase())
  );
}

/**
 * Create image generation task (for background processing)
 */
export async function createImageGenerationTask(
  productId: number,
  prompt: string
) {
  // TODO: Implement queue system (Bull, RabbitMQ, etc.)
  // This would:
  // 1. Create task in database/queue
  // 2. Return task ID to client
  // 3. Process in background worker
  // 4. Update product with generated image URL when done
  // 5. Send notification to admin

  return {
    taskId: `task_${Date.now()}`,
    status: "pending",
    createdAt: new Date(),
  };
}

