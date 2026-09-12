import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenAI({ apiKey });

export async function AnalyzeWithGemini(
    text: string,
    analysisType: "summary" | "qa" | "sentiment" | "entities" | "extract"
) {
    try {
        const prompt =
        analysisType === "summary"
            ? `You are an expert summarizer. Summarize the following text in the same language as the text. 
            Provide a concise summary of no more than 3 sentences. Focus on the main ideas and key points.
            Text: ${text}`
            : analysisType === "qa"
            ? `You are a helpful assistant. Answer the following question as accurately and concisely as possible.
            If the answer cannot be determined from the provided information, respond with "The information is not available."
            Question: ${text}`
            : analysisType === "sentiment"
            ? `Analyze the sentiment of the following text. Return a JSON object with these fields:
            - sentiment: "positive", "negative", "neutral", or "mixed"
            - confidence: a number between 0 and 1
            - explanation: a brief explanation in the same language as the text
            Text: ${text}`
            : analysisType === "entities"
            ? `Identify all named entities in the following text. Return a JSON array of objects. Each object should have:
            - entity: the exact text of the entity
            - type: one of PERSON, ORGANIZATION, LOCATION, DATE, MONEY, PRODUCT, or OTHER
            - context: a short phrase from the text where the entity appears
            Text: ${text}`
            : `Extract key information from the following text. Return a JSON object with the most important facts, 
            including names, dates, numbers, and locations. Use clear keys and values in the same language as the text.
            Text: ${text}`;

        const interaction = await genAI.interactions.create({
            model: "gemini-3.1-flash-lite",
            input: prompt,
        });

        // Ispravno svojstvo za dobijanje odgovora je output_text
        return interaction.output_text;

    } catch (error) {
        console.error("Error occurred while analyzing text with Gemini:", error);
        throw error;
    }
}