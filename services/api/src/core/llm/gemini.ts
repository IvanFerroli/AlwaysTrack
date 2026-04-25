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

export async function analyzeJobMatch(
  profileHeadline: string,
  profileSkills: string[],
  jobTitle: string,
  jobDescription: string
): Promise<{ score: number; rationale: string }> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
Você é um recrutador técnico sênior avaliando um candidato para uma vaga.

CANDIDATO:
Título: ${profileHeadline}
Skills: ${profileSkills.join(', ')}

VAGA:
Título: ${jobTitle}
Descrição: ${jobDescription}

Analise a aderência deste candidato a esta vaga.
Retorne um JSON estrito (sem formatação markdown \`\`\`json) contendo exatamente as seguintes chaves:
{
  "score": numero_de_0_a_100,
  "rationale": "Uma frase curta explicando a pontuação e os pontos mais fortes/fracos de aderência"
}
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text() || "";
    // Remove potential markdown blocks
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      rationale: parsed.rationale || "Sem justificativa."
    };
  } catch (err) {
    return { score: 0, rationale: "Erro ao consultar a IA para avaliação profunda." };
  }
}
