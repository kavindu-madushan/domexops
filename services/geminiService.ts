import { GoogleGenAI } from "@google/genai";
import { ReportRow } from "../types";
import { getSystemConfig } from "./db";

// Retrieve API key with priority: DB > Environment
const getApiKey = async (): Promise<string | undefined> => {
  try {
    const dbKey = await getSystemConfig('gemini_api_key');
    if (dbKey) return dbKey;
  } catch (e) {
    // Ignore DB error, fall back to env
  }
  return process.env.API_KEY;
}

export const analyzeReport = async (rows: ReportRow[]): Promise<string> => {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    return "Error: API Key is missing. Please contact Super Admin to configure the Gemini API Key.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const dataSummary = JSON.stringify(rows, null, 2);

  const prompt = `
    You are a logistics operations expert. Analyze the following daily operation report data for the "Embilipitiya Branch".
    
    Data:
    ${dataSummary}

    Please provide a concise analysis covering:
    1. **Delivery Performance**: Are the delivery percentages satisfactory? Is there a trend?
    2. **Backlog Management**: Analyze the "Yesterday Branch Hold" vs "Today Branch Hold". Is the backlog growing or shrinking?
    3. **Efficiency**: Look at the relationship between "Today Total Parcel", "Today On Route", and "Today Delivered".
    4. **Recommendations**: Give 2-3 specific actions the branch manager should take to improve metrics.

    Keep the tone professional and constructive. Format the response with clear headings in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "No analysis could be generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('403') || error.status === 403) {
       return "API Error: Key invalid or quota exceeded (403).";
    }
    return "Failed to analyze the report. Please try again later.";
  }
};

// --- New Feature: Auto-Dispatch Parser ---

export const parseDispatchText = async (rawText: string, targets: {branch_name: string, target: number}[]): Promise<any[]> => {
  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error("API Key is missing. Please check configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const targetNames = targets.map(t => t.branch_name).join(", ");

  const prompt = `
    Analyze the following unstructured text, which contains dispatch numbers for various courier branches.
    
    Text: "${rawText}"
    
    Task: Extract the branch name and the dispatch count number for each branch found.
    
    Rules:
    1. Only extract for branches that sound like these known targets: ${targetNames}. Fuzzy match if spelling is slightly off.
    2. Return a strict JSON array of objects.
    3. Object format: { "branch": "Exact Name From List", "dispatch": Number }.
    4. If a branch is mentioned but has no number, ignore it.
    5. Do not include markdown code blocks, just the JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    const text = response.text || "[]";
    // Sanitize in case model adds ```json
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Dispatch Parse Error:", error);
    if (error.message?.includes('403') || error.status === 403) {
       throw new Error("API Key Error (403): The key has been revoked or is invalid. Please update the API key.");
    }
    throw new Error("Failed to parse dispatch text.");
  }
};