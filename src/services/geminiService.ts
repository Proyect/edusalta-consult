import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY!;

export const askGemini = async (prompt: string, history: { role: "user" | "model", parts: { text: string }[] }[]) => {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: `Eres un asistente experto en normativa educativa de Salta, Argentina (EduSalta). 
      Tu objetivo es ayudar a los docentes a encontrar resoluciones, formularios y trámites.
      Usa un tono profesional, amable y servicial.
      Si el usuario pregunta por una resolución específica, intenta buscarla en la web si no tienes la información.
      Si el usuario pregunta por un formulario, busca el enlace directo en el sitio de EduSalta.
      Optimiza los procesos tediosos explicando paso a paso cómo realizar los trámites.`,
      tools: [{ googleSearch: {} }],
    },
    history,
  });

  const response = await chat.sendMessage({ message: prompt });
  return response.text;
};
