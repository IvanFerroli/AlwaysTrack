import { loadEnv } from "../../config/env.js";

export interface ExtractedField<T = string> {
  value: T | null;
  confidence: number | null;
  evidence: string | null;
}

export interface DocumentAiResult {
  documentKind: string | null;
  rawText: string | null;
  fields: {
    professionalName: ExtractedField;
    cpf: ExtractedField;
    licenseTypeName: ExtractedField;
    licenseNumber: ExtractedField;
    issuer: ExtractedField;
    uf: ExtractedField;
    issuedAt: ExtractedField;
    expiresAt: ExtractedField;
  };
  warnings: string[];
}

export interface DocumentAiProvider {
  provider: string;
  model?: string;
  analyze(input: { body: Buffer; mimeType: string; fileName: string }): Promise<DocumentAiResult>;
  analyzeSalesDocument?(input: { body: Buffer; mimeType: string; fileName: string }): Promise<SalesDocumentAiResult>;
}

export interface SalesDocumentAiItem {
  sku: string | null;
  description: string | null;
  category: string | null;
  quantity: number | null;
  unitAmountCents: number | null;
  totalAmountCents: number | null;
}

export interface SalesDocumentAiResult {
  documentKind: string | null;
  rawText: string | null;
  fields: {
    accessKey: ExtractedField;
    invoiceNumber: ExtractedField;
    series: ExtractedField;
    issuedAt: ExtractedField;
    issuerName: ExtractedField;
    buyerName: ExtractedField;
    totalAmountCents: ExtractedField<number>;
  };
  items: SalesDocumentAiItem[];
  warnings: string[];
}

const emptyResult: DocumentAiResult = {
  documentKind: null,
  rawText: null,
  fields: {
    professionalName: { value: null, confidence: null, evidence: null },
    cpf: { value: null, confidence: null, evidence: null },
    licenseTypeName: { value: null, confidence: null, evidence: null },
    licenseNumber: { value: null, confidence: null, evidence: null },
    issuer: { value: null, confidence: null, evidence: null },
    uf: { value: null, confidence: null, evidence: null },
    issuedAt: { value: null, confidence: null, evidence: null },
    expiresAt: { value: null, confidence: null, evidence: null }
  },
  warnings: []
};

function aiRequestSignal() {
  return AbortSignal.timeout(30_000);
}

export class FakeDocumentAiProvider implements DocumentAiProvider {
  provider = "fake";

  async analyze() {
    return {
      ...emptyResult,
      warnings: ["DOCUMENT_AI_PROVIDER nao configurado. Configure openai ou gemini para extracao real."]
    };
  }

  async analyzeSalesDocument() {
    return {
      documentKind: null,
      rawText: null,
      fields: {
        accessKey: { value: null, confidence: null, evidence: null },
        invoiceNumber: { value: null, confidence: null, evidence: null },
        series: { value: null, confidence: null, evidence: null },
        issuedAt: { value: null, confidence: null, evidence: null },
        issuerName: { value: null, confidence: null, evidence: null },
        buyerName: { value: null, confidence: null, evidence: null },
        totalAmountCents: { value: null, confidence: null, evidence: null }
      },
      items: [],
      warnings: ["DOCUMENT_AI_PROVIDER nao configurado. Configure openai ou gemini para extracao real."]
    };
  }
}

function extractionSchema() {
  const field = {
    type: "object",
    additionalProperties: false,
    properties: {
      value: { type: ["string", "null"] },
      confidence: { type: ["number", "null"], minimum: 0, maximum: 1 },
      evidence: { type: ["string", "null"] }
    },
    required: ["value", "confidence", "evidence"]
  };

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      documentKind: { type: ["string", "null"] },
      rawText: { type: ["string", "null"] },
      fields: {
        type: "object",
        additionalProperties: false,
        properties: {
          professionalName: field,
          cpf: field,
          licenseTypeName: field,
          licenseNumber: field,
          issuer: field,
          uf: field,
          issuedAt: field,
          expiresAt: field
        },
        required: ["professionalName", "cpf", "licenseTypeName", "licenseNumber", "issuer", "uf", "issuedAt", "expiresAt"]
      },
      warnings: { type: "array", items: { type: "string" } }
    },
    required: ["documentKind", "rawText", "fields", "warnings"]
  };
}

function salesDocumentExtractionSchema() {
  const field = {
    type: "object",
    additionalProperties: false,
    properties: {
      value: { type: ["string", "null"] },
      confidence: { type: ["number", "null"], minimum: 0, maximum: 1 },
      evidence: { type: ["string", "null"] }
    },
    required: ["value", "confidence", "evidence"]
  };
  const numberField = {
    ...field,
    properties: {
      ...field.properties,
      value: { type: ["number", "null"] }
    }
  };

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      documentKind: { type: ["string", "null"] },
      rawText: { type: ["string", "null"] },
      fields: {
        type: "object",
        additionalProperties: false,
        properties: {
          accessKey: field,
          invoiceNumber: field,
          series: field,
          issuedAt: field,
          issuerName: field,
          buyerName: field,
          totalAmountCents: numberField
        },
        required: ["accessKey", "invoiceNumber", "series", "issuedAt", "issuerName", "buyerName", "totalAmountCents"]
      },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            sku: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
            category: { type: ["string", "null"] },
            quantity: { type: ["number", "null"] },
            unitAmountCents: { type: ["number", "null"] },
            totalAmountCents: { type: ["number", "null"] }
          },
          required: ["sku", "description", "category", "quantity", "unitAmountCents", "totalAmountCents"]
        }
      },
      warnings: { type: "array", items: { type: "string" } }
    },
    required: ["documentKind", "rawText", "fields", "items", "warnings"]
  };
}

function outputText(response: unknown) {
  const output = (response as { output_text?: unknown }).output_text;
  if (typeof output === "string") return output;

  const items = (response as { output?: Array<{ content?: Array<{ text?: unknown }> }> }).output ?? [];
  return items
    .flatMap((item) => item.content ?? [])
    .map((content) => (typeof content.text === "string" ? content.text : ""))
    .filter(Boolean)
    .join("\n");
}

function inputContent(input: { body: Buffer; mimeType: string; fileName: string }) {
  const base64 = input.body.toString("base64");
  if (input.mimeType === "application/pdf") {
    return [
      {
        type: "input_file",
        filename: input.fileName,
        file_data: `data:${input.mimeType};base64,${base64}`
      }
    ];
  }

  return [
    {
      type: "input_image",
      detail: "high",
      image_url: `data:${input.mimeType};base64,${base64}`
    }
  ];
}

export class OpenAiDocumentAiProvider implements DocumentAiProvider {
  provider = "openai";

  constructor(
    private readonly apiKey: string,
    public readonly model: string
  ) {}

  async analyze(input: { body: Buffer; mimeType: string; fileName: string }) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: aiRequestSignal(),
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Extraia dados de documento profissional brasileiro para cadastro operacional. " +
                  "Responda somente pelo schema. Use null quando o campo nao estiver legivel. " +
                  "Nao invente datas, CPF ou numero. Datas devem sair em YYYY-MM-DD quando houver certeza."
              },
              ...inputContent(input)
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "alwaystrack_document_extraction",
            strict: true,
            schema: extractionSchema()
          }
        }
      })
    });

    const raw = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      const message = typeof raw === "object" && raw ? JSON.stringify(raw) : `OpenAI HTTP ${response.status}`;
      throw new Error(message);
    }

    const text = outputText(raw);
    if (!text) throw new Error("EMPTY_AI_RESPONSE");
    return JSON.parse(text) as DocumentAiResult;
  }

  async analyzeSalesDocument(input: { body: Buffer; mimeType: string; fileName: string }) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: aiRequestSignal(),
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Extraia dados de DANFE ou nota fiscal brasileira para operacao comercial de suplementos. " +
                  "Responda somente pelo schema. Use null quando o campo nao estiver legivel. " +
                  "Nao invente chave de acesso, valores, produtos ou datas. Datas em YYYY-MM-DD. Valores devem ser em centavos inteiros."
              },
              ...inputContent(input)
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "alwaystrack_sales_document_extraction",
            strict: true,
            schema: salesDocumentExtractionSchema()
          }
        }
      })
    });

    const raw = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      const message = typeof raw === "object" && raw ? JSON.stringify(raw) : `OpenAI HTTP ${response.status}`;
      throw new Error(message);
    }

    const text = outputText(raw);
    if (!text) throw new Error("EMPTY_AI_RESPONSE");
    return JSON.parse(text) as SalesDocumentAiResult;
  }
}

function geminiExtractionSchema() {
  const field = {
    type: "OBJECT",
    properties: {
      value: { type: "STRING", nullable: true },
      confidence: { type: "NUMBER", nullable: true },
      evidence: { type: "STRING", nullable: true }
    }
  };

  return {
    type: "OBJECT",
    properties: {
      documentKind: { type: "STRING", nullable: true },
      rawText: { type: "STRING", nullable: true },
      fields: {
        type: "OBJECT",
        properties: {
          professionalName: field,
          cpf: field,
          licenseTypeName: field,
          licenseNumber: field,
          issuer: field,
          uf: field,
          issuedAt: field,
          expiresAt: field
        }
      },
      warnings: { type: "ARRAY", items: { type: "STRING" } }
    }
  };
}

function geminiSalesDocumentExtractionSchema() {
  const field = {
    type: "OBJECT",
    properties: {
      value: { type: "STRING", nullable: true },
      confidence: { type: "NUMBER", nullable: true },
      evidence: { type: "STRING", nullable: true }
    }
  };
  const numberField = {
    type: "OBJECT",
    properties: {
      value: { type: "NUMBER", nullable: true },
      confidence: { type: "NUMBER", nullable: true },
      evidence: { type: "STRING", nullable: true }
    }
  };

  return {
    type: "OBJECT",
    properties: {
      documentKind: { type: "STRING", nullable: true },
      rawText: { type: "STRING", nullable: true },
      fields: {
        type: "OBJECT",
        properties: {
          accessKey: field,
          invoiceNumber: field,
          series: field,
          issuedAt: field,
          issuerName: field,
          buyerName: field,
          totalAmountCents: numberField
        }
      },
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            sku: { type: "STRING", nullable: true },
            description: { type: "STRING", nullable: true },
            category: { type: "STRING", nullable: true },
            quantity: { type: "NUMBER", nullable: true },
            unitAmountCents: { type: "NUMBER", nullable: true },
            totalAmountCents: { type: "NUMBER", nullable: true }
          }
        }
      },
      warnings: { type: "ARRAY", items: { type: "STRING" } }
    }
  };
}

export class GeminiDocumentAiProvider implements DocumentAiProvider {
  provider = "gemini";

  constructor(
    private readonly apiKey: string,
    public readonly model: string
  ) {}

  async analyze(input: { body: Buffer; mimeType: string; fileName: string }) {
    const base64 = input.body.toString("base64");
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: "POST",
      signal: aiRequestSignal(),
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Extraia dados de documento profissional brasileiro para cadastro operacional. Responda somente pelo schema. Use null quando o campo nao estiver legivel. Nao invente datas, CPF ou numero. Datas devem sair em YYYY-MM-DD quando houver certeza."
              },
              {
                inlineData: {
                  mimeType: input.mimeType === "application/pdf" ? "application/pdf" : input.mimeType,
                  data: base64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: geminiExtractionSchema()
        }
      })
    });

    const raw = (await response.json().catch(() => null)) as any;
    if (!response.ok) {
      const message = typeof raw === "object" && raw ? JSON.stringify(raw) : `Gemini HTTP ${response.status}`;
      throw new Error(message);
    }

    const text = raw.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("EMPTY_AI_RESPONSE");
    return JSON.parse(text) as DocumentAiResult;
  }

  async analyzeSalesDocument(input: { body: Buffer; mimeType: string; fileName: string }) {
    const base64 = input.body.toString("base64");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: "POST",
      signal: aiRequestSignal(),
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  "Extraia dados de DANFE ou nota fiscal brasileira para operacao comercial de suplementos. " +
                  "Responda somente pelo schema. Use null quando o campo nao estiver legivel. " +
                  "Nao invente chave de acesso, valores, produtos ou datas. Datas em YYYY-MM-DD. Valores devem ser em centavos inteiros."
              },
              {
                inlineData: {
                  mimeType: input.mimeType === "application/pdf" ? "application/pdf" : input.mimeType,
                  data: base64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: geminiSalesDocumentExtractionSchema()
        }
      })
    });

    const raw = (await response.json().catch(() => null)) as any;
    if (!response.ok) {
      const message = typeof raw === "object" && raw ? JSON.stringify(raw) : `Gemini HTTP ${response.status}`;
      throw new Error(message);
    }

    const text = raw.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("EMPTY_AI_RESPONSE");
    return JSON.parse(text) as SalesDocumentAiResult;
  }
}

export function getDocumentAiProvider(): DocumentAiProvider {
  const env = loadEnv();
  if (env.documentAiProvider === "openai" && env.openAiApiKey) {
    return new OpenAiDocumentAiProvider(env.openAiApiKey, env.documentAiModel);
  }
  if (env.documentAiProvider === "gemini" && env.geminiApiKey) {
    return new GeminiDocumentAiProvider(env.geminiApiKey, env.documentAiModel);
  }
  return new FakeDocumentAiProvider();
}
