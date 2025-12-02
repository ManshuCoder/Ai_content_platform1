"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Utility: retry with exponential backoff for 503/overload errors
async function retryRequest(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Retry only for transient errors (503 or overloaded)
      if (
        (error.message?.includes("503") ||
          error.message?.includes("overloaded") ||
          error.message?.includes("temporarily unavailable")) &&
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
  try {
    if (!title || title.trim().length === 0) {
      throw new Error("Title is required to generate content");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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

    // Run the generation with retry handling
    const result = await retryRequest(() => model.generateContent(prompt));

    const response = await result.response;
    const content = response.text();

    if (!content || content.trim().length < 100) {
      throw new Error("Generated content is too short or empty");
    }

    return {
      success: true,
      content: content.trim(),
    };
  } catch (error) {
    console.error("Gemini AI Error:", error);

    // Friendly messages for known issues
    if (error.message?.includes("API key")) {
      return {
        success: false,
        error: "Gemini API configuration issue. Please check your API key.",
      };
    }

    if (
      error.message?.includes("503") ||
      error.message?.includes("overloaded") ||
      error.message?.includes("temporarily unavailable")
    ) {
      return {
        success: false,
        error: "Gemini service is overloaded. Please try again in a few minutes.",
      };
    }

    if (error.message?.includes("quota") || error.message?.includes("limit")) {
      return {
        success: false,
        error: "Gemini quota limit reached. Please wait or upgrade your plan.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to generate blog content.",
    };
  }
}

export async function improveContent(
  currentContent,
  improvementType = "enhance"
) {
  try {
    if (!currentContent || currentContent.trim().length === 0) {
      throw new Error("Content is required for improvement");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const improvedContent = response.text();

    return {
      success: true,
      content: improvedContent.trim(),
    };
  } catch (error) {
    console.error("Content improvement error:", error);
    return {
      success: false,
      error: error.message || "Failed to improve content. Please try again.",
    };
  }
}
