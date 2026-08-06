"use server";

import { GoogleGenAI } from "@google/genai";
import { unstable_noStore as noStore } from "next/cache";

// Using explicit model instead of dynamic detection
const GEMINI_MODEL = "gemini-3.5-flash";

function getErrorMessage(error) {
  return error?.message || "Unexpected error while contacting Gemini.";
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_API_KEY in your .env.local file."
    );
  }

  return new GoogleGenAI({
    apiKey,
    apiVersion: "v1",
  });
}

// Utility: retry with exponential backoff for 503/overload errors
async function retryRequest(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const message = getErrorMessage(error);

      if (
        (message.includes("503") ||
          message.includes("overloaded") ||
          message.includes("temporarily unavailable")) &&
        i < retries - 1
      ) {
        const wait = delay * Math.pow(2, i);
        console.warn(`Gemini overloaded — retrying in ${wait / 1000}s...`);
        await new Promise((res) => setTimeout(res, wait));
      } else {
        throw error;
      }
    }
  }
}

export async function generateBlogContent(title, category = "", tags = []) {
  noStore();
  try {
    if (!title || title.trim().length === 0) {
      throw new Error("Title is required to generate content");
    }

    const ai = getGeminiClient();

    const prompt = `
Write a comprehensive blog post with the title: "${title}"

${category ? `Category: ${category}` : ""}
${tags.length > 0 ? `Tags: ${tags.join(", ")}` : ""}

Requirements:
- Write engaging, informative content that matches the title
- Use proper HTML formatting with headers (h2, h3), paragraphs, lists, and emphasis
- Include 3–5 main sections with clear subheadings
- Write in a conversational yet professional tone
- Make it approximately 800–1200 words
- Include practical insights, examples, or actionable advice where relevant
- Use <h2> for main sections and <h3> for subsections
- Use <p> tags for paragraphs
- Use <ul> and <li> for bullet points when appropriate
- Use <strong> and <em> for emphasis
- Ensure the content is original and valuable to readers
- Do NOT include the title itself in the output
`;

    const modelToUse = GEMINI_MODEL;

    const result = await retryRequest(() =>
      ai.models.generateContent({
        model: modelToUse,
        contents: prompt,
      })
    );

    const content = result?.text?.trim();

    if (!content || content.length < 100) {
      throw new Error("Generated content is too short or empty");
    }

    return {
      success: true,
      content,
    };
  } catch (error) {
    console.error("Gemini AI Error:", error);

    const message = getErrorMessage(error);

    if (message.includes("API key") || message.includes("authentication")) {
      return {
        success: false,
        error: "Gemini API configuration issue. Please check your API key.",
      };
    }

    if (
      message.includes("503") ||
      message.includes("overloaded") ||
      message.includes("temporarily unavailable")
    ) {
      return {
        success: false,
        error: "Gemini service is overloaded. Please try again in a few minutes.",
      };
    }

    if (message.includes("quota") || message.includes("limit")) {
      return {
        success: false,
        error: "Gemini quota limit reached. Please wait or upgrade your plan.",
      };
    }

    return {
      success: false,
      error: message || "Failed to generate blog content.",
    };
  }
}

export async function improveContent(currentContent, improvementType = "enhance") {
  noStore();
  try {
    if (!currentContent || currentContent.trim().length === 0) {
      throw new Error("Content is required for improvement");
    }

    const ai = getGeminiClient();

    let prompt = "";

    switch (improvementType) {
      case "expand":
        prompt = `
Take this blog content and expand it with more details, examples, and insights:

${currentContent}

Requirements:
- Keep the existing structure and main points
- Add more depth and detail to each section
- Include practical examples and insights
- Maintain the original tone and style
- Return the improved content in the same HTML format
`;
        break;

      case "simplify":
        prompt = `
Take this blog content and make it more concise and easier to read:

${currentContent}

Requirements:
- Keep all main points but make them clearer
- Remove unnecessary complexity
- Use simpler language where possible
- Maintain the HTML formatting
- Keep the essential information
`;
        break;

      default: // enhance
        prompt = `
Improve this blog content by making it more engaging and well-structured:

${currentContent}

Requirements:
- Improve the flow and readability
- Add engaging transitions between sections
- Enhance with better examples or explanations
- Maintain the original HTML structure
- Keep the same length approximately
- Make it more compelling to read
`;
    }

    const modelToUse = GEMINI_MODEL;

    const result = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
    });

    const improvedContent = result?.text?.trim();

    if (!improvedContent) {
      throw new Error("Gemini returned an empty response.");
    }

    return {
      success: true,
      content: improvedContent,
    };
  } catch (error) {
    console.error("Content improvement error:", error);
    return {
      success: false,
      error: getErrorMessage(error) || "Failed to improve content. Please try again.",
    };
  }
}
