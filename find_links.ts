import { GoogleGenAI } from "@google/genai";

async function findLinks() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: "Busca los enlaces directos de descarga de los formularios docentes de EduSalta (Salta, Argentina). Necesito los enlaces para: Declaración Jurada de Cargos, Solicitud de Licencia, Certificación de Servicios, Salario Familiar, Seguro de Vida, Traslado y Reclamo de Haberes. Devuelve un JSON con el formato: [{\"title\": \"...\", \"url\": \"...\"}]",
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });

  console.log(response.text);
}

findLinks();
