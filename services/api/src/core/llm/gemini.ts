import { GoogleGenAI } from "@google/genai";

export async function extractSkillsWithGemini(cvText: string): Promise<string[]> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Você é um especialista em recrutamento técnico de TI.
O texto abaixo é um currículo (CV).
Extraia TODAS as tecnologias, linguagens, frameworks, bibliotecas, metodologias, bancos de dados, ferramentas e plataformas de nuvem mencionadas.
Não crie skills novas, apenas extraia exatamente as que estão no texto.
Liste as skills separadas por vírgula. Apenas a lista, sem texto adicional.

Currículo:
"""
${cvText}
"""
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text || "";
  return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
}
