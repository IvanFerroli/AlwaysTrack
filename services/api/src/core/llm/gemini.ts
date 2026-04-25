import { GoogleGenerativeAI } from "@google/generative-ai";

export async function extractSkillsWithGemini(cvText: string): Promise<string[]> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

  const result = await model.generateContent(prompt);
  const text = result.response.text() || "";
  return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
}
