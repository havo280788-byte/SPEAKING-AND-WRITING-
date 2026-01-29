import { GoogleGenAI, Modality } from "@google/genai";
import { AIResponse, ChatMessage, SUPPORTED_MODELS, AIModelType } from "../types";

// --- Configuration Constants ---
// Define the fallback order explicitly as requested
const FALLBACK_ORDER: AIModelType[] = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash'];

// --- Helper Functions ---

// 1. Clean JSON String
const cleanJsonString = (str: string): string => {
  return str.replace(/```json\n?|```/g, "").trim();
};

// 2. Get API Key (LocalStorage -> Env)
export const getApiKey = (): string => {
  // Check LocalStorage first (browser context)
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('lingua_api_key');
    if (localKey) return localKey;
  }

  // Check Env Vars
  // Note: Vercel might not expose process.env to client unless prefixed with VITE_
  // But vite.config.ts defined 'process.env.API_KEY' define replacement.
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    // We return empty string instead of throwing here to let the UI prompt the user
    return "";
  }
  return key;
};

// 3. Retry / Fallback Wrapper
//    Accepts a function that takes a model name and returns a Promise.
//    If it fails, retries with next model in fallback list.
async function callAIWithRetry<T>(
  operationName: string,
  operationFn: (model: string, client: GoogleGenAI) => Promise<T>
): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing. Please click 'Settings' to add your key.");

  // Determine starting model preference from localStorage or default
  let currentModel: AIModelType = 'gemini-3-flash-preview';
  if (typeof window !== 'undefined') {
    const savedModel = localStorage.getItem('lingua_selected_model') as AIModelType;
    if (savedModel && SUPPORTED_MODELS.some(m => m.id === savedModel)) {
      currentModel = savedModel;
    }
  }

  // specific fallback chain starting from currentModel
  // If currentModel is standard, we follow fallback order (avoiding duplicates)
  // If currentModel is unique, we add it to the front.
  const uniqueFallbacks = Array.from(new Set([currentModel, ...FALLBACK_ORDER]));

  let lastError: any = null;

  for (const model of uniqueFallbacks) {
    try {
      console.log(`[${operationName}] Attempting with model: ${model}`);
      const client = new GoogleGenAI({ apiKey });
      return await operationFn(model, client);
    } catch (error: any) {
      console.warn(`[${operationName}] Failed with model ${model}:`, error.message);
      lastError = error;
      // Continue to next model in loop
    }
  }

  throw new Error(`System overloaded or Model Error. Please try again later. (Last error: ${lastError?.message})`);
}

// --- Service Functions ---

export const generateSpeech = async (text: string): Promise<string> => {
  return callAIWithRetry("generateSpeech", async (model, ai) => {
    // TTS might be specific to certain models or require the 'gemini-2.0-flash-exp' or specific TTS model.
    // For now, we try to use the selected model if it supports audio generation.
    // If not, this might fail and fallback, which is acceptable logic.
    // However, standard text models might not generate audio.
    // We will force 'gemini-2.0-flash-exp' if the selected model is likely text-only, OR trust the user's config.
    // Given 'gemini-3' is hypothetical, we assume it's multimodal.

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    return base64Audio;
  }).catch(err => {
    console.error("TTS Final Fail:", err);
    return "";
  });
};

export const analyzeWriting = async (
  text: string,
  taskType: "IELTS" | "TOEIC" | "General" = "General"
): Promise<AIResponse> => {
  return callAIWithRetry("analyzeWriting", async (model, ai) => {
    const prompt = `
      Act as an expert English teacher and examiner for ${taskType}.
      Analyze the following text provided by a student.
      
      Student Text: "${text}"
  
      Your task:
      1. Check for grammatical errors, spelling mistakes, and awkward phrasing.
      2. Suggest better vocabulary appropriate for a high-level context.
      3. Give a band score (0-10 scale based on accuracy and complexity).
      4. Provide a rewritten, improved version of the text.
      5. Provide specific sub-scores for: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.
  
      Return the result strictly in this JSON format:
      {
        "score": number,
        "scoreBreakdown": {
          "Task Response": number,
          "Coherence": number,
          "Vocabulary": number,
          "Grammar": number
        },
        "feedback": "string (general encouraging feedback)",
        "detailedErrors": [
          {
            "original": "string (the mistake)",
            "correction": "string (the fix)",
            "explanation": "string (why it is wrong)",
            "type": "grammar" | "vocabulary" | "coherence"
          }
        ],
        "improvedVersion": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const jsonText = cleanJsonString(response.text || "{}");
    return JSON.parse(jsonText) as AIResponse;
  });
};

export const analyzeSpeaking = async (
  audioBase64: string,
  topic: string = "General English"
): Promise<AIResponse> => {
  return gradeSpeakingSession([{ role: 'user', text: '(Audio Transcript Placeholder)' }], topic, audioBase64);
};

export const interactWithExaminer = async (
  history: ChatMessage[],
  topic: string,
  userAudioBase64?: string,
  specificQuestion?: string,
  isFinish: boolean = false
): Promise<{ userTranscription: string; aiResponse: string; aiAudioBase64?: string }> => {

  return callAIWithRetry("interactWithExaminer", async (model, ai) => {
    // 1. Construct parts/prompt...
    const context = history.map(h => `${h.role === 'ai' ? 'Examiner' : 'Student'}: ${h.text}`).join("\n");
    const systemInstruction = `
        You are a friendly but professional IELTS Speaking Examiner. 
        The topic is: "${topic}".
        Your goal is to conduct a short interview.
        Current Conversation History:
        ${context}
      `;

    let prompt = "";
    const parts: any[] = [];

    if (!userAudioBase64) {
      // Start of session
      if (specificQuestion) {
        prompt = `Start the interview. Introduce yourself briefly (1 sentence) and ask exactly this question: "${specificQuestion}". Return JSON: { "transcription": "", "response": "Your intro and question" }`;
      } else {
        prompt = `Start the interview. Introduce yourself briefly and ask the first question about "${topic}". Return JSON: { "transcription": "", "response": "Your intro and question" }`;
      }
      parts.push({ text: prompt });
    } else {
      const transcriptionInstruction = "1. Transcribe the user's audio accurately.";
      if (isFinish) {
        prompt = `
              The user just answered the final question via audio.
              ${transcriptionInstruction}
              2. Generate a brief polite closing statement (e.g. "Thank you for your answers. The test is now finished.").
              Do NOT ask another question.
              Return JSON: { "transcription": "exact words spoken by student", "response": "Closing statement" }
            `;
      } else if (specificQuestion) {
        prompt = `
              The user just answered via audio. 
              ${transcriptionInstruction}
              2. Generate a brief, natural response to acknowledge their answer (e.g., "That's interesting," "I see").
              3. Ask exactly this NEXT question: "${specificQuestion}".
              4. Keep your response concise (under 30 words) so the student talks more.
              Return JSON: { "transcription": "exact words spoken by student", "response": "Your reaction + next question" }
            `;
      } else {
        prompt = `
              The user just answered via audio. 
              ${transcriptionInstruction}
              2. Generate a brief, natural response to acknowledge their answer (e.g., "That's interesting," "I see").
              3. Ask the NEXT follow-up question related to the topic.
              4. Keep your response concise (under 30 words) so the student talks more.
              Return JSON: { "transcription": "exact words spoken by student", "response": "Your reaction + next question" }
            `;
      }
      parts.push({ inlineData: { mimeType: "audio/webm; codecs=opus", data: userAudioBase64 } });
      parts.push({ text: prompt });
    }

    // 2. Call API
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });
    const jsonText = cleanJsonString(response.text || "{}");
    const result = JSON.parse(jsonText);

    // 3. Audio generation (Nested call logic vs separate call)
    let aiAudioBase64 = "";
    if (result.response) {
      // Note: generateSpeech uses the same retry wrapper, so it will also adhere to fallback logic!
      aiAudioBase64 = await generateSpeech(result.response);
    }

    return {
      userTranscription: result.transcription || "",
      aiResponse: result.response,
      aiAudioBase64
    };
  });
};

export const gradeSpeakingSession = async (
  fullHistory: ChatMessage[],
  topic: string,
  lastAudioBase64?: string
): Promise<AIResponse> => {
  return callAIWithRetry("gradeSpeakingSession", async (model, ai) => {
    const transcript = fullHistory.map(h => `${h.role.toUpperCase()}: ${h.text}`).join("\n");
    const prompt = `
        Act as a Speaking Examiner.
        Topic: "${topic}".
        HERE IS THE TRANSCRIPT:
        ${transcript}

        Your task is to evaluate the student's performance based STRICTLY on the following rubric (Total 10 points):
        **1. Content (Max 3)**
        **2. Language (Max 3)**
        **3. Pronunciation (Max 2)**
        **4. Fluency (Max 2)**

        Return the result strictly in this JSON format:
        {
          "transcription": "Full session transcript...",
          "score": number, 
          "scoreBreakdown": { "Content": number, "Language": number, "Pronunciation": number, "Fluency": number },
          "feedback": "string (Overall feedback in Vietnamese or English)",
          "detailedErrors": [ { "original": "...", "correction": "...", "explanation": "...", "type": "pronunciation" } ]
        }
      `;

    const contents: any = { parts: [] };
    if (lastAudioBase64) {
      contents.parts.push({ inlineData: { mimeType: "audio/webm; codecs=opus", data: lastAudioBase64 } });
    }
    contents.parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: { responseMimeType: "application/json" }
    });

    const jsonText = cleanJsonString(response.text || "{}");
    return JSON.parse(jsonText) as AIResponse;
  });
};

export const analyzePronunciation = async (
  audioBase64: string,
  targetText: string
): Promise<AIResponse> => {
  return callAIWithRetry("analyzePronunciation", async (model, ai) => {
    const prompt = `
        Act as a strict pronunciation coach.
        The student is trying to read this specific sentence: "${targetText}".
        Analyze the attached audio recording based on the following rubric (Total 10 points).
        
        * Articulation (3)
        * Intonation & Stress (3)
        * Fluency & Linking (2)
        * Confidence (2)

        Return JSON:
        {
          "transcription": "string",
          "score": number,
          "scoreBreakdown": { "Articulation": number, "Intonation": number, "Fluency": number, "Confidence": number },
          "feedback": "string",
          "detailedErrors": []
        }
      `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/webm; codecs=opus", data: audioBase64 } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });

    const jsonText = cleanJsonString(response.text || "{}");
    return JSON.parse(jsonText) as AIResponse;
  });
};